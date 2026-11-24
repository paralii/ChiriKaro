import type { DoctorLeaveDTO } from "@application/dto/doctor/doctor-availability.dto.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IDeleteDoctorLeaveUseCase } from "@application/interfaces/use-cases/doctor/IDeleteDoctorLeaveUseCase.ts";
import { NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { isCalendarDate } from "@shared/utils/calendar-date.ts";
import { getDoctorForLeave } from "@application/use-cases/doctor/doctor-leave.helpers.ts";

export class DeleteDoctorLeaveUseCase implements IDeleteDoctorLeaveUseCase {
  constructor(private readonly doctors: IDoctorRepository) {}

  async execute(userId: string, clinicId: string, startDate: string): Promise<DoctorLeaveDTO[]> {
    const doctor = await getDoctorForLeave(this.doctors, userId, clinicId);
    if (!isCalendarDate(startDate)) throw new ValidationError("startDate must be a valid YYYY-MM-DD date");
    try {
      doctor.removeLeave(startDate);
    } catch (error) {
      throw new NotFoundError(error instanceof Error ? error.message : "Doctor leave");
    }
    return (await this.doctors.save(doctor)).leaves;
  }
}
