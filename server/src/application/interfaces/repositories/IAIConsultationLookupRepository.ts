import type { ConsultationRecord } from "@domain/entities/consultation.entity.ts";

export interface IAIConsultationLookupRepository {
  findById(id: string, clinicId: string): Promise<ConsultationRecord | null>;
}
