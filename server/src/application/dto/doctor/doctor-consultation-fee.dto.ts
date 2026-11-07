export interface DoctorConsultationFeeDTO {
  doctorId: string;
  consultationFee: number | null;
  updatedAt: Date;
}

export interface UpdateDoctorConsultationFeeDTO {
  doctorId: string;
  clinicId: string;
  consultationFee: unknown;
}
