import { DomainError } from "@domain/error/DomainError.ts";
import type { DoctorLeaveDTO } from "@application/dto/doctor/doctor-availability.dto.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { ICreateDoctorLeaveUseCase } from "@application/interfaces/use-cases/doctor/ICreateDoctorLeaveUseCase.ts";
import { ValidationError } from "@shared/errors/index.ts";
import { isCalendarDate } from "@shared/utils/calendar-date.ts";
import { getDoctorForLeave } from "@application/use-cases/doctor/doctor-leave.helpers.ts";

export class CreateDoctorLeaveUseCase implements ICreateDoctorLeaveUseCase {
  constructor(private readonly doctors: IDoctorRepository) {}

  async execute(userId: string, clinicId: string, input: unknown): Promise<DoctorLeaveDTO[]> {
    const doctor = await getDoctorForLeave(this.doctors, userId, clinicId);
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new ValidationError("Leave details must be an object");
    const value = input as Record<string, unknown>;
    if (Object.keys(value).some((key) => !["startDate", "endDate", "reason"].includes(key))) throw new ValidationError("Leave details contain an unsupported field");
    if (typeof value.startDate !== "string" || !isCalendarDate(value.startDate)) throw new ValidationError("startDate must be a valid YYYY-MM-DD date");
    if (typeof value.endDate !== "string" || !isCalendarDate(value.endDate)) throw new ValidationError("endDate must be a valid YYYY-MM-DD date");
    if (value.reason !== undefined && value.reason !== null && typeof value.reason !== "string") throw new ValidationError("reason must be text");
    try {
      doctor.addLeave({ startDate: value.startDate, endDate: value.endDate, reason: (value.reason as string | null | undefined) ?? null });
    } catch (error) {
      if (error instanceof DomainError) throw new ValidationError(error.message);
      throw error;
    }
    return (await this.doctors.save(doctor)).leaves;
  }
}
