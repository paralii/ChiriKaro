import type { DoctorListQueryDTO, DoctorListResultDTO, DoctorDetailDTO } from "@application/dto/super-admin/clinic-management.dto.ts";

export interface IManageDoctorsUseCase {
  list(query: DoctorListQueryDTO): Promise<DoctorListResultDTO>;
  getDetails(doctorId: string): Promise<DoctorDetailDTO>;
}
