import { DomainError } from "@domain/error/DomainError.ts";
import type { DoctorBreak, DoctorWorkingHour } from "@domain/entities/doctor.entity.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IConfigureDoctorAvailabilityUseCase } from "@application/interfaces/use-cases/doctor/IConfigureDoctorAvailabilityUseCase.ts";
import type { ConfigureDoctorAvailabilityInput, DoctorAvailabilityDTO } from "@application/dto/doctor/doctor-availability.dto.ts";
import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { toDoctorAvailabilityDTO } from "@application/mappers/doctor-availability.mapper.ts";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ConfigureDoctorAvailabilityUseCase implements IConfigureDoctorAvailabilityUseCase {
  constructor(
    private readonly _doctorRepository: IDoctorRepository,
    private readonly _clinicRepository: IClinicRepository,
  ) {}

  async execute(input: ConfigureDoctorAvailabilityInput): Promise<DoctorAvailabilityDTO> {
    if (!/^[a-f\d]{24}$/i.test(input.userId) || !/^[a-f\d]{24}$/i.test(input.clinicId)) throw new BadRequestError("Doctor or clinic id is invalid");
    const updates = this.parseUpdates(input.updates);
    const doctor = await this._doctorRepository.findByUserId(input.userId);
    if (!doctor) throw new NotFoundError("Doctor profile");
    if (doctor.clinicId !== input.clinicId) throw new BadRequestError("Doctor profile belongs to another clinic");
    const clinic = await this._clinicRepository.findById(input.clinicId);
    if (!clinic) throw new NotFoundError("Clinic");

    for (const hours of updates.workingHours.filter((item) => item.isOpen)) {
      const clinicHours = clinic.workingHours.find((item) => item.day.toUpperCase() === hours.day);
      if (!clinicHours?.isOpen || !TIME.test(clinicHours.startTime) || !TIME.test(clinicHours.endTime) ||
        hours.startTime < clinicHours.startTime || hours.endTime > clinicHours.endTime) {
        throw new ValidationError(`Doctor working hours for ${hours.day} must be within clinic working hours`);
      }
    }
    try {
      doctor.configureAvailability(updates);
    } catch (error) {
      if (error instanceof DomainError) throw new ValidationError(error.message);
      throw error;
    }
    return toDoctorAvailabilityDTO(await this._doctorRepository.save(doctor));
  }

  private parseUpdates(value: unknown): {
    workingHours: DoctorWorkingHour[];
    breaks: DoctorBreak[];
    slotDurationMinutes: number;
    bufferTimeMinutes: number;
  } {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError("Availability updates must be an object");
    const input = value as Record<string, unknown>;
    if (Object.keys(input).some((key) => !["workingHours", "breaks", "slotDurationMinutes", "bufferTimeMinutes"].includes(key))) throw new ValidationError("Availability updates contain an unsupported field");
    if (!Array.isArray(input.workingHours) || input.workingHours.some((item) => !item || typeof item !== "object" || Array.isArray(item) ||
      typeof (item as Record<string, unknown>).day !== "string" || typeof (item as Record<string, unknown>).isOpen !== "boolean" ||
      typeof (item as Record<string, unknown>).startTime !== "string" || typeof (item as Record<string, unknown>).endTime !== "string")) throw new ValidationError("workingHours must contain valid schedule entries");
    if (!Array.isArray(input.breaks) || input.breaks.some((item) => !item || typeof item !== "object" || Array.isArray(item) ||
      typeof (item as Record<string, unknown>).day !== "string" || typeof (item as Record<string, unknown>).startTime !== "string" || typeof (item as Record<string, unknown>).endTime !== "string")) throw new ValidationError("breaks must contain valid break entries");
    if (typeof input.slotDurationMinutes !== "number" || !Number.isInteger(input.slotDurationMinutes)) throw new ValidationError("slotDurationMinutes must be an integer");
    if (typeof input.bufferTimeMinutes !== "number" || !Number.isInteger(input.bufferTimeMinutes)) throw new ValidationError("bufferTimeMinutes must be an integer");
    return {
      workingHours: input.workingHours as DoctorWorkingHour[],
      breaks: input.breaks as DoctorBreak[],
      slotDurationMinutes: input.slotDurationMinutes,
      bufferTimeMinutes: input.bufferTimeMinutes,
    };
  }
}
