import { DomainError } from "@domain/error/DomainError.ts";
import { ClinicSetupStatus } from "@domain/enum/clinic-setup-status.enum.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IUpdateClinicSetupUseCase } from "@application/interfaces/use-cases/clinic/IUpdateClinicSetupUseCase.ts";
import type { ClinicProfileDTO } from "@application/dto/clinic/clinic-profile.dto.ts";
import { BadRequestError, ConflictError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { toClinicProfileDTO } from "@application/mappers/clinic-profile.mapper.ts";
import { findWorkingHoursOutsideClinic } from "@domain/policies/working-hours.policy.ts";

const normalizeSpecialization = (value: string): string => value.trim().toLocaleLowerCase();

export class UpdateClinicSetupUseCase implements IUpdateClinicSetupUseCase {
  constructor(private readonly _clinicRepository: IClinicRepository, private readonly _doctorRepository: IDoctorRepository) {}

  async execute(clinicId: string, updates: unknown): Promise<ClinicProfileDTO> {
    if (!/^[a-f\d]{24}$/i.test(clinicId)) throw new BadRequestError("Clinic id is invalid");
    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      throw new ValidationError("Clinic setup updates must be an object");
    }
    const clinic = await this._clinicRepository.findById(clinicId);
    if (!clinic) throw new NotFoundError("Clinic");
    if (clinic.setupStatus === ClinicSetupStatus.PENDING_VERIFICATION) {
      throw new ConflictError("Clinic application details cannot be edited while review is pending");
    }
    const data = updates as Record<string, unknown>;
    const allowed = ["location", "specializations", "workingHours", "timeZone"];
    if (!Object.keys(data).length || Object.keys(data).some((key) => !allowed.includes(key))) {
      throw new ValidationError("Provide only location, specializations, or workingHours");
    }
    if (clinic.setupStatus === ClinicSetupStatus.VERIFIED && Object.keys(data).some((key) => key === "location")) {
      throw new ConflictError("Verified clinic location cannot be edited through setup");
    }
    try {
      if (data.location !== undefined) {
        if (!data.location || typeof data.location !== "object" || Array.isArray(data.location)) throw new ValidationError("Location must be an object");
        const location = data.location as Record<string, unknown>;
        const allowedLocation = ["address", "city", "state", "pincode"];
        if (Object.keys(location).some((key) => !allowedLocation.includes(key))) throw new ValidationError("Location contains unsupported fields");
        if (Object.values(location).some((value) => value !== null && typeof value !== "string")) throw new ValidationError("Location values must be strings or null");
        clinic.updateProfile(location as Parameters<typeof clinic.updateProfile>[0]);
      }
      if (data.specializations !== undefined) {
        if (!Array.isArray(data.specializations) || data.specializations.some((item) => typeof item !== "string")) throw new ValidationError("Specializations must be an array of strings");
        const next = data.specializations as string[];
        const nextSet = new Set(next.map(normalizeSpecialization));
        const removedInUse = clinic.specializations.filter((item) => !nextSet.has(normalizeSpecialization(item)));
        if (removedInUse.length) {
          const doctors = await this._doctorRepository.findByClinic(clinicId);
          const assigned = removedInUse.filter((item) => doctors.some((doctor) =>
            doctor.clinicId === clinicId && doctor.specializations.some((value) => normalizeSpecialization(value) === normalizeSpecialization(item))));
          if (assigned.length) throw new ConflictError(`Reassign doctors before removing: ${assigned.join(", ")}`);
        }
        clinic.updateSpecializations(next);
      }
      if (data.workingHours !== undefined) {
        if (!Array.isArray(data.workingHours)) throw new ValidationError("Working hours must be an array");
        clinic.updateWorkingHours(data.workingHours as Parameters<typeof clinic.updateWorkingHours>[0]);
        const doctors = await this._doctorRepository.findByClinic(clinicId);
        const conflict = doctors
          .filter((doctor) => doctor.clinicId === clinicId)
          .find((doctor) => findWorkingHoursOutsideClinic(doctor.workingHours, clinic.workingHours));
        if (conflict) throw new ConflictError("Clinic hours conflict with a doctor schedule. Update doctor hours before changing clinic hours.");
      }
      if (data.timeZone !== undefined) {
        if (typeof data.timeZone !== "string") throw new ValidationError("timeZone must be an IANA timezone string");
        clinic.updateTimeZone(data.timeZone);
      }
    } catch (error) {
      if (error instanceof DomainError) throw new ValidationError(error.message);
      throw error;
    }
    return toClinicProfileDTO(await this._clinicRepository.save(clinic));
  }
}
