import type { DatedDoctorAvailabilityDTO } from "@application/dto/doctor/doctor-availability.dto.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IAppointmentRepository } from "@application/interfaces/repositories/IAppointmentRepository.ts";
import type { IPublicListingIdService } from "@application/interfaces/services/IPublicListingIdService.ts";
import type { IGetPublicListingAvailabilityUseCase } from "@application/interfaces/use-cases/search/IGetPublicListingAvailabilityUseCase.ts";
import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";
import { ClinicSetupStatus } from "@domain/enum/clinic-setup-status.enum.ts";
import { generateDatedSlots } from "@domain/policies/dated-slot-generation.policy.ts";
import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { isCalendarDate } from "@shared/utils/calendar-date.ts";

const MAX_BOOKING_HORIZON_DAYS = 90;

export class GetPublicListingAvailabilityUseCase implements IGetPublicListingAvailabilityUseCase {
  constructor(
    private readonly _listingIdService: IPublicListingIdService,
    private readonly _clinicRepository: IClinicRepository,
    private readonly _doctorRepository: IDoctorRepository,
    private readonly _appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(listingId: string, date: string): Promise<DatedDoctorAvailabilityDTO> {
    if (!isCalendarDate(date)) throw new ValidationError("Choose a valid date in YYYY-MM-DD format");
    const requested = new Date(`${date}T00:00:00.000Z`);

    const claims = this._listingIdService.read(listingId);
    const clinic = await this._clinicRepository.findById(claims.clinicId);
    const doctor = await this._doctorRepository.findByUserId(claims.doctorUserId);
    if (!clinic || !doctor || doctor.clinicId !== claims.clinicId || clinic.status !== ClinicStatus.APPROVED ||
      clinic.setupStatus !== ClinicSetupStatus.VERIFIED || doctor.verificationStatus !== "VERIFIED" || doctor.consultationFee === null || doctor.consultationFee <= 0) {
      throw new NotFoundError("Bookable clinic and doctor listing");
    }

    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: clinic.timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    const todayParts = Object.fromEntries(formatter.formatToParts(new Date()).map((part) => [part.type, part.value]));
    const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
    const todayUtc = new Date(`${today}T00:00:00.000Z`);
    const daysAhead = Math.floor((requested.getTime() - todayUtc.getTime()) / 86_400_000);
    if (daysAhead < 0 || daysAhead > MAX_BOOKING_HORIZON_DAYS) throw new BadRequestError(`Choose a date from today through the next ${MAX_BOOKING_HORIZON_DAYS} days`);

    if (doctor.leaves.some((leave) => leave.startDate <= date && leave.endDate >= date)) {
      return { clinicTimeZone: clinic.timeZone, localDate: date, slots: [] };
    }

    const generatedSlots = generateDatedSlots({
      date,
      timeZone: clinic.timeZone,
      clinicHours: clinic.workingHours,
      doctorHours: doctor.workingHours,
      doctorBreaks: doctor.breaks,
      slotDurationMinutes: doctor.slotDurationMinutes,
      bufferTimeMinutes: doctor.bufferTimeMinutes,
    });
    const now = new Date();
    const overlaps = generatedSlots.length
      ? await this._appointmentRepository.findActiveOverlaps(
        claims.clinicId,
        claims.doctorUserId,
        date,
        generatedSlots[0]!.startAt,
        generatedSlots[generatedSlots.length - 1]!.endAt,
        now,
      )
      : [];
    const slots = generatedSlots.filter((slot) => !overlaps.some((reserved) => reserved.startsAt < slot.endAt && reserved.endsAt > slot.startAt));
    return { clinicTimeZone: clinic.timeZone, localDate: date, slots };
  }
}
