import type { DoctorFeeChangeRequestDTO, CreateDoctorFeeChangeRequestDTO, ReviewDoctorFeeChangeRequestDTO } from "@application/dto/doctor/doctor-fee-change-request.dto.ts";

export interface IManageDoctorFeeChangeRequestsUseCase {
  listForDoctor(userId: string, clinicId: string): Promise<DoctorFeeChangeRequestDTO[]>;
  request(userId: string, clinicId: string, dto: CreateDoctorFeeChangeRequestDTO): Promise<DoctorFeeChangeRequestDTO>;
  listPendingForClinic(clinicId: string): Promise<DoctorFeeChangeRequestDTO[]>;
  review(dto: ReviewDoctorFeeChangeRequestDTO): Promise<DoctorFeeChangeRequestDTO>;
}
