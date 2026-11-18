import { DomainError } from "@domain/error/DomainError.ts";
import type { Doctor, DoctorBreak, DoctorWorkingHour } from "@domain/entities/doctor.entity.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IConfigureDoctorAvailabilityUseCase } from "@application/interfaces/use-cases/doctor/IConfigureDoctorAvailabilityUseCase.ts";
import type { IConfigureClinicDoctorWorkingHoursUseCase } from "@application/interfaces/use-cases/doctor/IConfigureClinicDoctorWorkingHoursUseCase.ts";
import type { ConfigureClinicDoctorWorkingHoursInput, ConfigureDoctorAvailabilityInput, DoctorAvailabilityDTO } from "@application/dto/doctor/doctor-availability.dto.ts";
import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { toDoctorAvailabilityDTO } from "@application/mappers/doctor-availability.mapper.ts";
import { findWorkingHoursOutsideClinic } from "@domain/policies/working-hours.policy.ts";

export class ConfigureDoctorAvailabilityUseCase implements IConfigureDoctorAvailabilityUseCase, IConfigureClinicDoctorWorkingHoursUseCase {
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
    return this.saveAvailability(doctor, updates, clinic.workingHours);
  }

  async executeForClinicAdmin(input: ConfigureClinicDoctorWorkingHoursInput): Promise<DoctorAvailabilityDTO> {
    if (!/^[a-f\d]{24}$/i.test(input.doctorId) || !/^[a-f\d]{24}$/i.test(input.clinicId)) {
      throw new BadRequestError("Doctor or clinic id is invalid");
    }
    const workingHours = this.parseWorkingHours(input.workingHours);
    const doctor = await this._doctorRepository.findByIdAndClinic(input.doctorId, input.clinicId);
    if (!doctor) throw new NotFoundError("Doctor");
    const clinic = await this._clinicRepository.findById(input.clinicId);
    if (!clinic) throw new NotFoundError("Clinic");
    return this.saveAvailability(doctor, {
      workingHours,
      breaks: doctor.breaks,
      slotDurationMinutes: doctor.slotDurationMinutes,
      bufferTimeMinutes: doctor.bufferTimeMinutes,
    }, clinic.workingHours);
  }

  private ensureWithinClinic(workingHours: DoctorWorkingHour[], clinicHours: Parameters<typeof findWorkingHoursOutsideClinic>[1]): void {
    const conflict = findWorkingHoursOutsideClinic(workingHours, clinicHours);
    if (conflict) throw new ValidationError(`Doctor working hours for ${conflict.day} must be within clinic working hours`);
  }

  private async saveAvailability(
    doctor: Doctor,
    updates: { workingHours: DoctorWorkingHour[]; breaks: DoctorBreak[]; slotDurationMinutes: number; bufferTimeMinutes: number },
    clinicHours: Parameters<typeof findWorkingHoursOutsideClinic>[1],
  ): Promise<DoctorAvailabilityDTO> {
    try {
      doctor.configureAvailability(updates);
    } catch (error) {
      if (error instanceof DomainError) throw new ValidationError(error.message);
      throw error;
    }
    this.ensureWithinClinic(doctor.workingHours, clinicHours);
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
    const workingHours = this.parseWorkingHours(input.workingHours);
    if (!Array.isArray(input.breaks) || input.breaks.some((item) => !item || typeof item !== "object" || Array.isArray(item) ||
      typeof (item as Record<string, unknown>).day !== "string" || typeof (item as Record<string, unknown>).startTime !== "string" || typeof (item as Record<string, unknown>).endTime !== "string")) throw new ValidationError("breaks must contain valid break entries");
    if (typeof input.slotDurationMinutes !== "number" || !Number.isInteger(input.slotDurationMinutes)) throw new ValidationError("slotDurationMinutes must be an integer");
    if (typeof input.bufferTimeMinutes !== "number" || !Number.isInteger(input.bufferTimeMinutes)) throw new ValidationError("bufferTimeMinutes must be an integer");
    return {
      workingHours,
      breaks: input.breaks as DoctorBreak[],
      slotDurationMinutes: input.slotDurationMinutes,
      bufferTimeMinutes: input.bufferTimeMinutes,
    };
  }

  private parseWorkingHours(value: unknown): DoctorWorkingHour[] {
    if (!Array.isArray(value) || value.some((item) => !item || typeof item !== "object" || Array.isArray(item) ||
      typeof (item as Record<string, unknown>).day !== "string" || typeof (item as Record<string, unknown>).isOpen !== "boolean" ||
      typeof (item as Record<string, unknown>).startTime !== "string" || typeof (item as Record<string, unknown>).endTime !== "string")) {
      throw new ValidationError("workingHours must contain valid schedule entries");
    }
    return value as DoctorWorkingHour[];
  }
}
