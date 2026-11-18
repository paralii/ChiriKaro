import type { PatientListQueryDTO, PatientListResultDTO } from "@application/dto/super-admin/clinic-management.dto.ts";
import type { SuperAdminPatientSummary } from "@application/interfaces/repositories/ISuperAdminClinicRepository.ts";

export interface IManagePatientsUseCase {
  list(query: PatientListQueryDTO): Promise<PatientListResultDTO>;
  setStatus(patientId: string, status: unknown): Promise<SuperAdminPatientSummary>;
  getDetails(patientId: string): Promise<SuperAdminPatientSummary & { updatedAt: Date; avatar: string | null }>;
}
