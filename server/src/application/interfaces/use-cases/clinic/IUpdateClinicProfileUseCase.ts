import type {
  ClinicProfileDTO,
  UpdateClinicProfileDTO,
} from "@application/dto/clinic/clinic-profile.dto.ts";

export interface IUpdateClinicProfileUseCase {
  execute(dto: UpdateClinicProfileDTO): Promise<ClinicProfileDTO>;
}
