import type {
  PatientProfileDTO,
  UpdatePatientProfileDTO,
} from "@application/dto/patient/patient-profile.dto.ts";

export interface IUpdatePatientProfileUseCase {
  execute(dto: UpdatePatientProfileDTO): Promise<PatientProfileDTO>;
}
