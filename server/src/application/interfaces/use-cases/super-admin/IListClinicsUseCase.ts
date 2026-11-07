import type {
  ClinicListQueryDTO,
  ClinicListResultDTO,
} from "@application/dto/super-admin/clinic-management.dto.ts";

export interface IListClinicsUseCase {
  execute(query: ClinicListQueryDTO): Promise<ClinicListResultDTO>;
}
