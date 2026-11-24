import type { DoctorLeaveDTO } from "@application/dto/doctor/doctor-availability.dto.ts";

export interface IListDoctorLeavesUseCase {
  execute(userId: string, clinicId: string): Promise<DoctorLeaveDTO[]>;
}
