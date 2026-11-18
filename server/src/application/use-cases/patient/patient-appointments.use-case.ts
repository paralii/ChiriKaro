import { createHash } from "node:crypto";
import { Types } from "mongoose";
import { AppointmentStatus } from "@domain/enum/appointment-status.enum.ts";
import { PaymentStatus } from "@domain/enum/payment-status.enum.ts";
import type { AppointmentRecord } from "@domain/entities/booking-workflow.entity.ts";
import type { AppointmentDTO, CreateAppointmentInput } from "@application/dto/patient/appointment.dto.ts";
import type { RescheduleAppointmentInput } from "@application/dto/patient/appointment.dto.ts";
import type { IAppointmentRepository, AppointmentSlotReservation } from "@application/interfaces/repositories/IAppointmentRepository.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IPublicListingIdService } from "@application/interfaces/services/IPublicListingIdService.ts";
import type { IGetPublicListingAvailabilityUseCase } from "@application/interfaces/use-cases/search/IGetPublicListingAvailabilityUseCase.ts";
import type { IPatientAppointmentsUseCase } from "@application/interfaces/use-cases/patient/IPatientAppointmentsUseCase.ts";
import { BOOKING_DEFAULTS } from "@domain/policies/booking-concurrency.policy.ts";
import { APPOINTMENT_CHANGE_POLICY } from "@domain/policies/appointment-change.policy.ts";
import { AppointmentPaymentModel } from "@infrastructure/database/mongodb/models/AppointmentPaymentModel.ts";
import { BadRequestError, ConflictError, NotFoundError, ValidationError } from "@shared/errors/index.ts";

function toDTO(appointment: AppointmentRecord, listingIdService: IPublicListingIdService): AppointmentDTO {
  return {
    appointmentId: appointment.id,
    listingId: listingIdService.create({ clinicId: appointment.clinicId, doctorUserId: appointment.doctorUserId }),
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
    changeWindowOpen: appointment.slot.startsAt.getTime() > Date.now() + APPOINTMENT_CHANGE_POLICY.cutoffHours * 60 * 60_000,
    createdAt: appointment.createdAt,
    rescheduleCount: appointment.rescheduleCount,
    changeHistory: appointment.changeHistory,
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
      rescheduleCount: 0,
      changeHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    try {
      return toDTO(await this._appointmentRepository.create(appointment), this._listingIdService);
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
    return appointments.map((appointment) => toDTO(appointment, this._listingIdService));
  }

  async get(appointmentId: string, patientUserId: string): Promise<AppointmentDTO> {
    if (!/^[a-f\d]{24}$/i.test(patientUserId)) throw new BadRequestError("Authenticated patient identity is invalid");
    if (!Types.ObjectId.isValid(appointmentId)) throw new BadRequestError("Appointment id is invalid");
    const appointment = await this._appointmentRepository.findOwnedById(appointmentId, patientUserId);
    if (!appointment) throw new NotFoundError("Appointment");
    return toDTO(appointment, this._listingIdService);
  }

  async cancel(appointmentId: string, patientUserId: string): Promise<AppointmentDTO> {
    if (!Types.ObjectId.isValid(patientUserId) || !Types.ObjectId.isValid(appointmentId)) throw new BadRequestError("Appointment or patient identity is invalid");
    const current = await this._appointmentRepository.findOwnedById(appointmentId, patientUserId);
    if (!current) throw new NotFoundError("Appointment");
    if (current.status === AppointmentStatus.CANCELLED) {
      await this._appointmentRepository.releaseSlot({
        clinicId: current.clinicId, doctorUserId: current.doctorUserId, localDate: current.slot.localDate,
        patientUserId, appointmentId, startsAt: current.slot.startsAt, endsAt: current.slot.endsAt, holdExpiresAt: current.holdExpiresAt,
      });
      const payment = await AppointmentPaymentModel.findOne({ appointmentId: new Types.ObjectId(appointmentId) }).exec();
      return { ...toDTO(current, this._listingIdService), cancellationRefundReviewStatus: payment?.refundReviewStatus ?? "NOT_REQUIRED" };
    }
    const now = new Date();
    const cutoff = new Date(now.getTime() + APPOINTMENT_CHANGE_POLICY.cutoffHours * 60 * 60_000);
    if (current.slot.startsAt <= cutoff) throw new ConflictError("Appointments can only be cancelled at least 24 hours before their start time");
    if (current.status === AppointmentStatus.PENDING_PAYMENT && current.holdExpiresAt <= now) throw new ConflictError("The payment hold expired; this appointment cannot be cancelled");
    if (![AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING_PAYMENT].includes(current.status)) throw new ConflictError("This appointment can no longer be cancelled");
    const cancelled = await this._appointmentRepository.cancelOwned(appointmentId, patientUserId, now, cutoff);
    if (!cancelled) throw new ConflictError("The appointment changed while cancellation was being processed. Refresh and try again.");

    await this._appointmentRepository.releaseSlot({
      clinicId: cancelled.clinicId, doctorUserId: cancelled.doctorUserId, localDate: cancelled.slot.localDate,
      patientUserId, appointmentId, startsAt: cancelled.slot.startsAt, endsAt: cancelled.slot.endsAt,
      holdExpiresAt: cancelled.holdExpiresAt,
    });
    const payment = await AppointmentPaymentModel.findOne({ appointmentId: new Types.ObjectId(appointmentId) }).exec();
    if (payment) {
      await AppointmentPaymentModel.updateOne({ _id: payment._id, status: PaymentStatus.SUCCEEDED }, { $set: { refundReviewStatus: "PENDING_REVIEW" } }).exec();
      await AppointmentPaymentModel.updateOne({ _id: payment._id, status: PaymentStatus.PENDING }, { $set: { status: PaymentStatus.CANCELLED } }).exec();
      const latestPayment = await AppointmentPaymentModel.findById(payment._id).exec();
      if (latestPayment?.status === PaymentStatus.SUCCEEDED) {
        await AppointmentPaymentModel.updateOne({ _id: payment._id, status: PaymentStatus.SUCCEEDED }, { $set: { refundReviewStatus: "PENDING_REVIEW" } }).exec();
        return { ...toDTO(cancelled, this._listingIdService), cancellationRefundReviewStatus: "PENDING_REVIEW" };
      }
    }
    return { ...toDTO(cancelled, this._listingIdService), cancellationRefundReviewStatus: "NOT_REQUIRED" };
  }

  async reschedule(input: RescheduleAppointmentInput): Promise<AppointmentDTO> {
    if (!Types.ObjectId.isValid(input.patientUserId) || !Types.ObjectId.isValid(input.appointmentId)) throw new BadRequestError("Appointment or patient identity is invalid");
    if (typeof input.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new ValidationError("date must use YYYY-MM-DD format");
    if (typeof input.startsAt !== "string" || Number.isNaN(Date.parse(input.startsAt))) throw new ValidationError("startsAt must be a valid slot start timestamp");
    if (typeof input.listingId !== "string" || input.listingId.length > 512) throw new ValidationError("Directory listing handle is invalid");
    const current = await this._appointmentRepository.findOwnedById(input.appointmentId, input.patientUserId);
    if (!current) throw new NotFoundError("Appointment");
    const now = new Date();
    const cutoff = new Date(now.getTime() + APPOINTMENT_CHANGE_POLICY.cutoffHours * 60 * 60_000);
    if (current.slot.startsAt <= cutoff) throw new ConflictError("Appointments can only be rescheduled at least 24 hours before their start time");
    if (current.status === AppointmentStatus.PENDING_PAYMENT && current.holdExpiresAt <= now) throw new ConflictError("The payment hold expired; this appointment cannot be rescheduled");
    if (![AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING_PAYMENT].includes(current.status)) throw new ConflictError("This appointment can no longer be rescheduled");
    const claims = this._listingIdService.read(input.listingId);
    if (claims.clinicId !== current.clinicId || claims.doctorUserId !== current.doctorUserId) throw new BadRequestError("Rescheduling must use the same clinic and doctor");
    const startsAt = new Date(input.startsAt);
    if (input.date === current.slot.localDate && startsAt.getTime() === current.slot.startsAt.getTime()) return toDTO(current, this._listingIdService);
    if (current.rescheduleCount >= APPOINTMENT_CHANGE_POLICY.maximumReschedules) throw new ConflictError("This appointment has already used its one reschedule");
    if (startsAt.getTime() === current.slot.startsAt.getTime()) throw new BadRequestError("Choose a different appointment time");
    const availability = await this._availabilityUseCase.execute(input.listingId, input.date);
    const target = availability.slots.find((slot) => slot.startAt.getTime() === startsAt.getTime());
    if (!target) throw new ConflictError("That time is no longer available. Refresh availability and choose another time.");
    const newSlot = {
      clinicId: current.clinicId,
      doctorUserId: current.doctorUserId,
      localDate: input.date,
      timezone: availability.clinicTimeZone,
      startsAt: target.startAt,
      endsAt: target.endAt,
      localStartTime: target.localStartTime,
      localEndTime: target.localEndTime,
    };
    if (newSlot.startsAt <= cutoff) throw new ConflictError("Choose a new appointment time at least 24 hours from now");
    const reservation = {
      clinicId: current.clinicId, doctorUserId: current.doctorUserId, localDate: input.date,
      patientUserId: input.patientUserId, appointmentId: input.appointmentId,
      startsAt: newSlot.startsAt, endsAt: newSlot.endsAt, holdExpiresAt: current.holdExpiresAt,
      status: current.status as "PENDING_PAYMENT" | "CONFIRMED",
    };
    if (!await this._appointmentRepository.reserveSlot(reservation)) throw new ConflictError("That time was just reserved by another patient. Refresh availability and choose another time.");
    const updated = await this._appointmentRepository.rescheduleOwned(input.appointmentId, input.patientUserId, now, cutoff, newSlot);
    if (!updated) {
      await this._appointmentRepository.releaseSlot(reservation);
      throw new ConflictError("The appointment changed while rescheduling. Refresh and try again.");
    }
    await this._appointmentRepository.releaseSlot({
      clinicId: current.clinicId, doctorUserId: current.doctorUserId, localDate: current.slot.localDate,
      patientUserId: input.patientUserId, appointmentId: input.appointmentId,
      startsAt: current.slot.startsAt, endsAt: current.slot.endsAt, holdExpiresAt: current.holdExpiresAt,
    });
    return toDTO(updated, this._listingIdService);
  }

  private returnIdempotent(appointment: AppointmentRecord, fingerprint: string): AppointmentDTO {
    if (appointment.requestFingerprint !== fingerprint) throw new ConflictError("This Idempotency-Key was already used for another booking request");
    return toDTO(appointment, this._listingIdService);
  }
}
