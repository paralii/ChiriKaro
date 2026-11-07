import { DomainError } from "@domain/error/DomainError.ts";
import { Doctor } from "@domain/entities/doctor.entity.ts";
import type { DoctorGender, DoctorWorkingHour } from "@domain/entities/doctor.entity.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IUpdateDoctorOnboardingUseCase } from "@application/interfaces/use-cases/doctor/IUpdateDoctorOnboardingUseCase.ts";
import type { DoctorOnboardingDTO, DoctorOnboardingStep } from "@application/dto/doctor/doctor-onboarding.dto.ts";
import { BadRequestError, ValidationError } from "@shared/errors/index.ts";
import { toDoctorOnboardingDTO } from "@application/mappers/doctor-onboarding.mapper.ts";

const STEP_FIELDS: Record<DoctorOnboardingStep, string[]> = {
  basic: ["firstName", "lastName", "gender", "dateOfBirth"],
  professional: ["professionalTitle", "qualifications", "yearsOfExperience", "registrationNumber", "registrationAuthority"],
  practice: ["specializations", "procedures", "workingHours"],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const validateStringList = (value: unknown, field: string): string[] => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new ValidationError(`${field} must be an array of strings`);
  }
  return value as string[];
};

export class UpdateDoctorOnboardingUseCase implements IUpdateDoctorOnboardingUseCase {
  constructor(private readonly _doctorRepository: IDoctorRepository) {}

  async execute(dto: Parameters<IUpdateDoctorOnboardingUseCase["execute"]>[0]): Promise<DoctorOnboardingDTO> {
    if (!/^[a-f\d]{24}$/i.test(dto.userId) || !/^[a-f\d]{24}$/i.test(dto.clinicId)) {
      throw new BadRequestError("Doctor or clinic id is invalid");
    }
    if (!Object.hasOwn(STEP_FIELDS, dto.step)) throw new ValidationError("Onboarding step is invalid");
    if (!isRecord(dto.updates) || Object.keys(dto.updates).length === 0) {
      throw new ValidationError("Onboarding updates must be a non-empty object");
    }
    const allowedFields = STEP_FIELDS[dto.step];
    if (Object.keys(dto.updates).some((field) => !allowedFields.includes(field))) {
      throw new ValidationError(`Updates contain fields outside the ${dto.step} step`);
    }

    let doctor = await this._doctorRepository.findByUserId(dto.userId);
    if (doctor && doctor.clinicId !== dto.clinicId) throw new BadRequestError("Doctor profile belongs to another clinic");
    if (!doctor) {
      if (dto.step !== "basic" || typeof dto.updates.firstName !== "string" || typeof dto.updates.lastName !== "string") {
        throw new ValidationError("Complete the basic step first");
      }
      doctor = Doctor.create({
        userId: dto.userId,
        clinicId: dto.clinicId,
        firstName: dto.updates.firstName,
        lastName: dto.updates.lastName,
      });
    }

    try {
      if (dto.step === "basic") this.updateBasic(doctor, dto.updates);
      if (dto.step === "professional") this.updateProfessional(doctor, dto.updates);
      if (dto.step === "practice") this.updatePractice(doctor, dto.updates);
    } catch (error) {
      if (error instanceof DomainError) throw new ValidationError(error.message);
      throw error;
    }

    return toDoctorOnboardingDTO(await this._doctorRepository.save(doctor));
  }

  private updateBasic(doctor: Doctor, updates: Record<string, unknown>): void {
    if (updates.firstName !== undefined && typeof updates.firstName !== "string") throw new ValidationError("firstName must be a string");
    if (updates.lastName !== undefined && typeof updates.lastName !== "string") throw new ValidationError("lastName must be a string");
    const allowedGenders = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"];
    if (updates.gender !== undefined && updates.gender !== null && (typeof updates.gender !== "string" || !allowedGenders.includes(updates.gender))) {
      throw new ValidationError("gender is invalid");
    }
    let dateOfBirth: Date | null | undefined;
    if (updates.dateOfBirth !== undefined) {
      if (updates.dateOfBirth === null) dateOfBirth = null;
      else if (typeof updates.dateOfBirth === "string") dateOfBirth = new Date(updates.dateOfBirth);
      else throw new ValidationError("dateOfBirth must be an ISO date string or null");
      if (dateOfBirth && Number.isNaN(dateOfBirth.getTime())) throw new ValidationError("dateOfBirth must be a valid date");
    }
    doctor.updateBasicInformation({
      ...(typeof updates.firstName === "string" ? { firstName: updates.firstName } : {}),
      ...(typeof updates.lastName === "string" ? { lastName: updates.lastName } : {}),
      ...(updates.gender !== undefined ? { gender: updates.gender === null ? null : updates.gender as DoctorGender } : {}),
      ...(dateOfBirth !== undefined ? { dateOfBirth } : {}),
    });
  }

  private updateProfessional(doctor: Doctor, updates: Record<string, unknown>): void {
    for (const field of ["professionalTitle", "registrationNumber", "registrationAuthority"] as const) {
      if (updates[field] !== undefined && updates[field] !== null && typeof updates[field] !== "string") {
        throw new ValidationError(`${field} must be a string or null`);
      }
    }
    if (updates.qualifications !== undefined) validateStringList(updates.qualifications, "qualifications");
    if (updates.yearsOfExperience !== undefined && updates.yearsOfExperience !== null && typeof updates.yearsOfExperience !== "number") {
      throw new ValidationError("yearsOfExperience must be a number or null");
    }
    doctor.updateProfessionalInformation({
      ...(updates.professionalTitle !== undefined ? { professionalTitle: updates.professionalTitle as string | null } : {}),
      ...(updates.qualifications !== undefined ? { qualifications: updates.qualifications as string[] } : {}),
      ...(updates.yearsOfExperience !== undefined ? { yearsOfExperience: updates.yearsOfExperience as number | null } : {}),
      ...(updates.registrationNumber !== undefined ? { registrationNumber: updates.registrationNumber as string | null } : {}),
      ...(updates.registrationAuthority !== undefined ? { registrationAuthority: updates.registrationAuthority as string | null } : {}),
    });
  }

  private updatePractice(doctor: Doctor, updates: Record<string, unknown>): void {
    for (const field of ["specializations", "procedures"] as const) {
      if (updates[field] !== undefined) validateStringList(updates[field], field);
    }
    if (updates.workingHours !== undefined) {
      if (!Array.isArray(updates.workingHours) || updates.workingHours.some((hour) => !isRecord(hour))) {
        throw new ValidationError("workingHours must be an array of working hour objects");
      }
      const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
      for (const hour of updates.workingHours as Record<string, unknown>[]) {
        if (Object.keys(hour).some((field) => !["day", "isOpen", "startTime", "endTime"].includes(field)) ||
          typeof hour.day !== "string" || !days.includes(hour.day) || typeof hour.isOpen !== "boolean" ||
          typeof hour.startTime !== "string" || typeof hour.endTime !== "string") {
          throw new ValidationError("workingHours contains an invalid entry");
        }
      }
    }
    doctor.updatePracticeInformation({
      ...(updates.specializations !== undefined ? { specializations: updates.specializations as string[] } : {}),
      ...(updates.procedures !== undefined ? { procedures: updates.procedures as string[] } : {}),
      ...(updates.workingHours !== undefined ? { workingHours: updates.workingHours as DoctorWorkingHour[] } : {}),
    });
  }
}
