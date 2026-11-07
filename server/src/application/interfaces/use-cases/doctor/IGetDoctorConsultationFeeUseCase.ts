import type { DoctorConsultationFeeDTO } from "@application/dto/doctor/doctor-consultation-fee.dto.ts";

export interface IGetDoctorConsultationFeeUseCase {
  execute(userId: string, clinicId: string): Promise<DoctorConsultationFeeDTO>;
}
