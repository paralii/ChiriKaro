import type {
  ClinicDoctorSpecializationDTO,
  UpdateClinicDoctorSpecializationsDTO,
} from "@application/dto/clinic/clinic-doctor-specialization.dto.ts";

export interface IUpdateClinicDoctorSpecializationsUseCase {
  execute(dto: UpdateClinicDoctorSpecializationsDTO): Promise<ClinicDoctorSpecializationDTO>;
}
