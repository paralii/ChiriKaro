import type { MedicalHistory } from "@domain/entities/consultation.entity.ts";

export interface IAIPatientHistoryRepository {
  getMedicalHistory(patientUserId: string): Promise<{ history: MedicalHistory } | null>;
}
