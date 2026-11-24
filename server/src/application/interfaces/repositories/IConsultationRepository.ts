import type { ConsultationRecord } from "@domain/entities/consultation.entity.ts";
export interface IConsultationRepository {
  findByQueueEntry(queueEntryId: string): Promise<ConsultationRecord | null>;
  findById(id: string, clinicId: string): Promise<ConsultationRecord | null>;
  listForPatient(patientUserId: string, clinicId: string): Promise<ConsultationRecord[]>;
  create(record: ConsultationRecord): Promise<ConsultationRecord>;
  saveDraft(id: string, clinicId: string, doctorUserId: string, data: ConsultationRecord["data"], history: ConsultationRecord["medicalHistorySnapshot"]): Promise<ConsultationRecord | null>;
  addAttachment(id: string, clinicId: string, doctorUserId: string, attachment: ConsultationRecord["attachments"][number]): Promise<ConsultationRecord | null>;
  removeAttachment(id: string, clinicId: string, doctorUserId: string, attachmentId: string): Promise<{ record: ConsultationRecord; documentKey: string } | null>;
  finalize(id: string, clinicId: string, doctorUserId: string, actorUserId: string, completedAt: Date): Promise<ConsultationRecord | null>;
}
