import type { Clinic } from "@domain/entities/clinic.entity.ts";

export interface SuperAdminDoctorSummary {
  name: string;
  professionalTitle: string | null;
  verificationStatus: string;
  specializations: string[];
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

export interface ISuperAdminClinicRepository {
  findById(id: string): Promise<Clinic | null>;
  findOwnerName(ownerId: string): Promise<string | null>;
  findDoctors(clinicId: string): Promise<SuperAdminDoctorSummary[]>;
  findTeamMembers(clinicId: string): Promise<SuperAdminClinicTeamMemberSummary[]>;
  findPage(options: { skip: number; limit: number }): Promise<{
    clinics: Clinic[];
    totalItems: number;
  }>;
  save(clinic: Clinic): Promise<Clinic>;
  findPatientsPage(options: { skip: number; limit: number }): Promise<{ patients: SuperAdminPatientSummary[]; totalItems: number }>;
  updatePatientStatus(patientId: string, status: "ACTIVE" | "SUSPENDED"): Promise<SuperAdminPatientSummary | null>;
}
