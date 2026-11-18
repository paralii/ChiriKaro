import type { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";

export interface ClinicListQueryDTO {
  page?: unknown;
  limit?: unknown;
  search?: unknown;
  status?: unknown;
}

export interface ClinicSummaryDTO {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  contactEmail: string | null;
  status: ClinicStatus;
  setupStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClinicDetailsDTO extends ClinicSummaryDTO {
  ownerName: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  registrationNumber: string | null;
  specializations: string[];
  workingHours: Array<{ day: string; isOpen: boolean; startTime: string; endTime: string }>;
  documents: Array<{ documentType: string; uploadedAt: Date }>;
  reviewHistory: Array<{ decision: "APPROVED" | "REJECTED"; reason: string | null; reviewedAt: Date }>;
  doctors: Array<{ name: string; professionalTitle: string | null; verificationStatus: string; specializations: string[] }>;
  staff: Array<{ name: string; role: "CLINIC_ADMIN" | "STAFF"; status: string }>;
}

export interface ClinicListResultDTO {
  clinics: ClinicSummaryDTO[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PatientListQueryDTO { page?: unknown; limit?: unknown; search?: unknown; status?: unknown; }
export interface PatientListResultDTO {
  patients: Array<{ id: string; name: string; email: string; status: string; createdAt: Date }>;
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface DoctorListQueryDTO { page?: unknown; limit?: unknown; search?: unknown; status?: unknown; }
export interface DoctorListResultDTO {
  doctors: Array<{ id: string; name: string; email: string | null; clinicName: string | null; professionalTitle: string | null; verificationStatus: string; specializations: string[]; consultationFee: number | null }>;
  page: number; limit: number; totalItems: number; totalPages: number;
}
export interface DoctorDetailDTO {
  name: string; email: string | null; clinicName: string | null; professionalTitle: string | null;
  qualifications: string[]; yearsOfExperience: number | null; registrationNumber: string | null;
  registrationAuthority: string | null; verificationStatus: string; rejectionReason: string | null;
  specializations: string[]; procedures: string[]; consultationFee: number | null;
  workingHours: Array<{ day: string; isOpen: boolean; startTime: string; endTime: string }>;
  documents: Array<{ documentType: string; status: string; uploadedAt: Date; rejectionReason: string | null }>;
  createdAt: Date; updatedAt: Date;
}
export type PatientDetailDTO = PatientListResultDTO["patients"][number] & { updatedAt: Date; avatar: string | null };

export interface UpdateClinicStatusDTO {
  clinicId: string;
  status: unknown;
  reason?: unknown;
  reviewerId?: string | null;
}
