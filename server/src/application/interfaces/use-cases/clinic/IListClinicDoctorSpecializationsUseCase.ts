import type { ClinicDoctorSpecializationDTO } from "@application/dto/clinic/clinic-doctor-specialization.dto.ts";

export interface IListClinicDoctorSpecializationsUseCase {
  execute(clinicId: string): Promise<ClinicDoctorSpecializationDTO[]>;
}
