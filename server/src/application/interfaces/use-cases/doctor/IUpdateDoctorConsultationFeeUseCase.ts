import type {
  DoctorConsultationFeeDTO,
  UpdateDoctorConsultationFeeDTO,
} from "@application/dto/doctor/doctor-consultation-fee.dto.ts";

export interface IUpdateDoctorConsultationFeeUseCase {
  execute(dto: UpdateDoctorConsultationFeeDTO): Promise<DoctorConsultationFeeDTO>;
}
