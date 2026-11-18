export type DoctorFeeChangeRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export interface DoctorFeeChangeRequestDTO {
  requestId: string;
  doctorId: string;
  doctorName?: string;
  currentFeeAtRequest: number | null;
  requestedFee: number;
  reason: string | null;
  status: DoctorFeeChangeRequestStatus;
  reviewReason: string | null;
  requestedAt: Date;
  reviewedAt: Date | null;
}
export interface CreateDoctorFeeChangeRequestDTO { requestedFee: unknown; reason?: unknown; }
export interface ReviewDoctorFeeChangeRequestDTO { doctorId: string; requestId: string; decision: unknown; reason?: unknown; reviewerId: string; clinicId: string; }
