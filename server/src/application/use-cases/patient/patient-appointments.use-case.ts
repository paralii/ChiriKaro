import { createHash } from "node:crypto";
import { Types } from "mongoose";
import { AppointmentStatus } from "@domain/enum/appointment-status.enum.ts";
import type { AppointmentRecord } from "@domain/entities/booking-workflow.entity.ts";
import type { AppointmentDTO, CreateAppointmentInput } from "@application/dto/patient/appointment.dto.ts";
import type { IAppointmentRepository, AppointmentSlotReservation } from "@application/interfaces/repositories/IAppointmentRepository.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IPublicListingIdService } from "@application/interfaces/services/IPublicListingIdService.ts";
import type { IGetPublicListingAvailabilityUseCase } from "@application/interfaces/use-cases/search/IGetPublicListingAvailabilityUseCase.ts";
import type { IPatientAppointmentsUseCase } from "@application/interfaces/use-cases/patient/IPatientAppointmentsUseCase.ts";
import { BOOKING_DEFAULTS } from "@domain/policies/booking-concurrency.policy.ts";
import { BadRequestError, ConflictError, NotFoundError, ValidationError } from "@shared/errors/index.ts";

function toDTO(appointment: AppointmentRecord): AppointmentDTO {
  return {
    appointmentId: appointment.id,
    clinicName: appointment.clinicNameSnapshot,
    doctorName: appointment.doctorNameSnapshot,
    localDate: appointment.slot.localDate,
    timeZone: appointment.slot.timezone,
    startsAt: appointment.slot.startsAt,
    endsAt: appointment.slot.endsAt,
    localStartTime: appointment.slot.localStartTime,
    localEndTime: appointment.slot.localEndTime,
    feeAmountMinor: appointment.feeSnapshot.amountMinor,
    feeCurrency: appointment.feeSnapshot.currency,
    status: appointment.status,
    holdExpiresAt: appointment.holdExpiresAt,
    holdExpired: appointment.holdExpiresAt <= new Date(),
    createdAt: appointment.createdAt,
  };
}

export class PatientAppointmentsUseCase implements IPatientAppointmentsUseCase {
  constructor(
    private readonly _appointmentRepository: IAppointmentRepository,
    private readonly _clinicRepository: IClinicRepository,
    private readonly _doctorRepository: IDoctorRepository,
    private readonly _listingIdService: IPublicListingIdService,
    private readonly _availabilityUseCase: IGetPublicListingAvailabilityUseCase,
  ) {}

  async create(input: CreateAppointmentInput): Promise<AppointmentDTO> {
    if (!/^[a-f\d]{24}$/i.test(input.patientUserId)) throw new BadRequestError("Authenticated patient identity is invalid");
    if (typeof input.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new ValidationError("date must use YYYY-MM-DD format");
    if (typeof input.startsAt !== "string" || Number.isNaN(Date.parse(input.startsAt))) throw new ValidationError("startsAt must be a valid slot start timestamp");
    if (typeof input.idempotencyKey !== "string" || !/^[A-Za-z0-9._:-]{16,128}$/.test(input.idempotencyKey)) {
      throw new ValidationError("Idempotency-Key must contain 16 to 128 safe characters");
    }
    if (typeof input.listingId !== "string" || input.listingId.length > 512) throw new ValidationError("Directory listing handle is invalid");

    const claims = this._listingIdService.read(input.listingId);
    const requestedStart = new Date(input.startsAt);
    const fingerprint = createHash("sha256").update(JSON.stringify({
      clinicId: claims.clinicId,
      doctorUserId: claims.doctorUserId,
      date: input.date,
      startsAt: requestedStart.toISOString(),
    })).digest("hex");
    const existing = await this._appointmentRepository.findByIdempotencyKey(input.patientUserId, input.idempotencyKey);
    if (existing) return this.returnIdempotent(existing, fingerprint);

    const availability = await this._availabilityUseCase.execute(input.listingId, input.date);
    const slot = availability.slots.find((candidate) => candidate.startAt.getTime() === requestedStart.getTime());
    if (!slot) throw new ConflictError("That time is no longer available. Refresh availability and choose another time.");

    const [clinic, doctor] = await Promise.all([
      this._clinicRepository.findById(claims.clinicId),
      this._doctorRepository.findByUserId(claims.doctorUserId),
    ]);
    if (!clinic || !doctor || doctor.clinicId !== claims.clinicId || doctor.consultationFee === null || doctor.consultationFee <= 0) {
      throw new NotFoundError("Bookable clinic and doctor listing");
    }
    const amountMinor = Math.round(doctor.consultationFee * 100);
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 1) throw new ValidationError("The consultation fee is not payable");

    const now = new Date();
    const holdExpiresAt = new Date(now.getTime() + BOOKING_DEFAULTS.unpaidSlotHoldMinutes * 60_000);
    const appointmentId = new Types.ObjectId().toString();
    const reservation: AppointmentSlotReservation = {
      clinicId: claims.clinicId,
      doctorUserId: claims.doctorUserId,
      localDate: input.date,
      patientUserId: input.patientUserId,
      appointmentId,
      startsAt: slot.startAt,
      endsAt: slot.endAt,
      holdExpiresAt,
    };
    const reserved = await this._appointmentRepository.reserveSlot(reservation);
    if (!reserved) {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const retry = await this._appointmentRepository.findByIdempotencyKey(input.patientUserId, input.idempotencyKey);
        if (retry) return this.returnIdempotent(retry, fingerprint);
        await new Promise<void>((resolve) => setTimeout(resolve, 25));
      }
      throw new ConflictError("That time was just reserved by another patient. Refresh availability and choose another time.");
    }

    const appointment: AppointmentRecord = {
      id: appointmentId,
      patientUserId: input.patientUserId,
      clinicId: claims.clinicId,
      doctorUserId: claims.doctorUserId,
      clinicNameSnapshot: clinic.name,
      doctorNameSnapshot: `${doctor.firstName} ${doctor.lastName}`,
      slot: {
        clinicId: claims.clinicId,
        doctorUserId: claims.doctorUserId,
        localDate: input.date,
        timezone: clinic.timeZone,
        startsAt: slot.startAt,
        endsAt: slot.endAt,
        localStartTime: slot.localStartTime,
        localEndTime: slot.localEndTime,
      },
      feeSnapshot: { amountMinor, currency: "INR" },
      status: AppointmentStatus.PENDING_PAYMENT,
      idempotencyKey: input.idempotencyKey,
      requestFingerprint: fingerprint,
      holdExpiresAt,
      createdAt: now,
      updatedAt: now,
    };

    try {
      return toDTO(await this._appointmentRepository.create(appointment));
    } catch (error) {
      let retry: AppointmentRecord | null;
      try {
        retry = await this._appointmentRepository.findByIdempotencyKey(input.patientUserId, input.idempotencyKey);
      } catch {
        throw error;
      }
      await this._appointmentRepository.releaseSlot(reservation);
      if (retry) return this.returnIdempotent(retry, fingerprint);
      throw error;
    }
  }

  async list(patientUserId: string): Promise<AppointmentDTO[]> {
    if (!/^[a-f\d]{24}$/i.test(patientUserId)) throw new BadRequestError("Authenticated patient identity is invalid");
    const appointments = await this._appointmentRepository.findForPatient(patientUserId);
    return appointments.map(toDTO);
  }

  async get(appointmentId: string, patientUserId: string): Promise<AppointmentDTO> {
    if (!/^[a-f\d]{24}$/i.test(patientUserId)) throw new BadRequestError("Authenticated patient identity is invalid");
    if (!Types.ObjectId.isValid(appointmentId)) throw new BadRequestError("Appointment id is invalid");
    const appointment = await this._appointmentRepository.findOwnedById(appointmentId, patientUserId);
    if (!appointment) throw new NotFoundError("Appointment");
    return toDTO(appointment);
  }

  private returnIdempotent(appointment: AppointmentRecord, fingerprint: string): AppointmentDTO {
    if (appointment.requestFingerprint !== fingerprint) throw new ConflictError("This Idempotency-Key was already used for another booking request");
    return toDTO(appointment);
  }
}
