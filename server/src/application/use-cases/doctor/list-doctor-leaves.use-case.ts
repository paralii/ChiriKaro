import type { DoctorLeaveDTO } from "@application/dto/doctor/doctor-availability.dto.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IListDoctorLeavesUseCase } from "@application/interfaces/use-cases/doctor/IListDoctorLeavesUseCase.ts";
import { getDoctorForLeave } from "@application/use-cases/doctor/doctor-leave.helpers.ts";

export class ListDoctorLeavesUseCase implements IListDoctorLeavesUseCase {
  constructor(private readonly doctors: IDoctorRepository) {}

  async execute(userId: string, clinicId: string): Promise<DoctorLeaveDTO[]> {
    return (await getDoctorForLeave(this.doctors, userId, clinicId)).leaves;
  }
}
