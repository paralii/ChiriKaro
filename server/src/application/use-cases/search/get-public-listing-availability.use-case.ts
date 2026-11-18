import type { DatedDoctorAvailabilityDTO } from "@application/dto/doctor/doctor-availability.dto.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IPublicListingIdService } from "@application/interfaces/services/IPublicListingIdService.ts";
import type { IGetPublicListingAvailabilityUseCase } from "@application/interfaces/use-cases/search/IGetPublicListingAvailabilityUseCase.ts";
import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";
import { ClinicSetupStatus } from "@domain/enum/clinic-setup-status.enum.ts";
import { generateDatedSlots } from "@domain/policies/dated-slot-generation.policy.ts";
import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_BOOKING_HORIZON_DAYS = 90;

export class GetPublicListingAvailabilityUseCase implements IGetPublicListingAvailabilityUseCase {
  constructor(
    private readonly _listingIdService: IPublicListingIdService,
    private readonly _clinicRepository: IClinicRepository,
    private readonly _doctorRepository: IDoctorRepository,
  ) {}

  async execute(listingId: string, date: string): Promise<DatedDoctorAvailabilityDTO> {
    if (!DATE_PATTERN.test(date)) throw new ValidationError("date must use YYYY-MM-DD format");
    const requested = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(requested.getTime()) || requested.toISOString().slice(0, 10) !== date) throw new ValidationError("date must be a valid calendar date");

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

    const slots = generateDatedSlots({
      date,
      timeZone: clinic.timeZone,
      clinicHours: clinic.workingHours,
      doctorHours: doctor.workingHours,
      doctorBreaks: doctor.breaks,
      slotDurationMinutes: doctor.slotDurationMinutes,
      bufferTimeMinutes: doctor.bufferTimeMinutes,
    });
    return { clinicTimeZone: clinic.timeZone, localDate: date, slots };
  }
}
