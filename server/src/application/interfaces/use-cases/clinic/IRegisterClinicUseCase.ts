import type {
  RegisterClinicDTO,
  RegisterClinicResultDTO,
} from "@application/dto/clinic/register-clinic.dto.ts";

export interface IRegisterClinicUseCase {
  execute(dto: RegisterClinicDTO): Promise<RegisterClinicResultDTO>;
}
