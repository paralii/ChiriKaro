import type { DoctorLeaveDTO } from "@application/dto/doctor/doctor-availability.dto.ts";

export interface IDeleteDoctorLeaveUseCase {
  execute(userId: string, clinicId: string, startDate: string): Promise<DoctorLeaveDTO[]>;
}
