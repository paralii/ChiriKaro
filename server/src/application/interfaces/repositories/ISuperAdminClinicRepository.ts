import type { Clinic } from "@domain/entities/clinic.entity.ts";
import type { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";
import type { DoctorVerificationStatus } from "@domain/entities/doctor.entity.ts";

export interface SuperAdminClinicDoctorSummary {
  id: string; name: string; email: string | null; clinicName: string | null;
  professionalTitle: string | null; verificationStatus: string; specializations: string[]; consultationFee: number | null;
}

export interface SuperAdminClinicTeamMemberSummary {
  name: string;
  role: "CLINIC_ADMIN" | "STAFF";
  status: string;
}

export interface SuperAdminPatientSummary {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: Date;
}

export interface SuperAdminDoctorSummary {
  id: string; name: string; email: string | null; clinicName: string | null;
  professionalTitle: string | null; verificationStatus: string;
  specializations: string[]; consultationFee: number | null;
}

export interface SuperAdminDoctorDetails extends SuperAdminDoctorSummary {
  qualifications: string[]; yearsOfExperience: number | null; registrationNumber: string | null;
  registrationAuthority: string | null; rejectionReason: string | null; procedures: string[];
  workingHours: Array<{ day: string; isOpen: boolean; startTime: string; endTime: string }>;
  documents: Array<{ documentType: string; status: string; uploadedAt: Date; rejectionReason: string | null }>;
  createdAt: Date; updatedAt: Date;
}

export interface ISuperAdminClinicRepository {
  findById(id: string): Promise<Clinic | null>;
  findOwnerName(ownerId: string): Promise<string | null>;
  findDoctors(clinicId: string): Promise<SuperAdminClinicDoctorSummary[]>;
  findTeamMembers(clinicId: string): Promise<SuperAdminClinicTeamMemberSummary[]>;
  findPage(options: { skip: number; limit: number; search?: string; status?: ClinicStatus }): Promise<{
    clinics: Clinic[];
    totalItems: number;
  }>;
  save(clinic: Clinic): Promise<Clinic>;
  findPatientsPage(options: { skip: number; limit: number; search?: string; status?: "ACTIVE" | "SUSPENDED" }): Promise<{ patients: SuperAdminPatientSummary[]; totalItems: number }>;
  findPatientById(patientId: string): Promise<(SuperAdminPatientSummary & { updatedAt: Date; avatar: string | null }) | null>;
  updatePatientStatus(patientId: string, status: "ACTIVE" | "SUSPENDED"): Promise<SuperAdminPatientSummary | null>;
  findDoctorsPage(options: { skip: number; limit: number; search?: string; status?: DoctorVerificationStatus }): Promise<{ doctors: SuperAdminDoctorSummary[]; totalItems: number }>;
  findDoctorDetails(doctorId: string): Promise<SuperAdminDoctorDetails | null>;
}
