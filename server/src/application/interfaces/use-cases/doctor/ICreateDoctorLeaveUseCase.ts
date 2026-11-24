import type { DoctorLeaveDTO } from "@application/dto/doctor/doctor-availability.dto.ts";

export interface ICreateDoctorLeaveUseCase {
  execute(userId: string, clinicId: string, input: unknown): Promise<DoctorLeaveDTO[]>;
}
