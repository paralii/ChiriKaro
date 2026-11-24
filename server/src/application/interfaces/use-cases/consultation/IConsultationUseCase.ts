import type { ConsultationDTO } from "@application/dto/consultation/consultation.dto.ts";
import type { MedicalHistory } from "@domain/entities/consultation.entity.ts";
export interface IConsultationUseCase {
  listPatientPrescriptions(patientUserId: string): Promise<Array<{ consultationId: string; doctorName: string; clinicName: string; prescribedAt: Date; prescriptions: ConsultationDTO["data"]["prescriptions"] }>>;
  patientPrescriptionPdf(consultationId: string, patientUserId: string): Promise<import("node:stream").Readable>;
  doctorPrescriptionPdf(consultationId: string, clinicId: string, doctorUserId: string): Promise<import("node:stream").Readable>;
  open(queueEntryId: string, clinicId: string, doctorUserId: string): Promise<ConsultationDTO>;
  get(id: string, clinicId: string, doctorUserId: string): Promise<ConsultationDTO>;
  listPatient(patientUserId: string, clinicId: string, doctorUserId: string): Promise<ConsultationDTO[]>;
  save(id: string, clinicId: string, doctorUserId: string, actorUserId: string, data: unknown, historySnapshot?: unknown): Promise<ConsultationDTO>;
  updateMedicalHistory(patientUserId: string, clinicId: string, doctorUserId: string, actorUserId: string, history: MedicalHistory): Promise<{ history: MedicalHistory; updatedBy: string; updatedAt: Date }>;
  getMedicalHistory(patientUserId: string, clinicId: string, doctorUserId: string): Promise<{ history: MedicalHistory; updatedBy: string | null; updatedAt: Date | null }>;
  finalize(id: string, clinicId: string, doctorUserId: string, actorUserId: string): Promise<ConsultationDTO>;
  addAttachment(id: string, clinicId: string, doctorUserId: string, actorUserId: string, fileName: string, contentType: string, content: Buffer, category: string): Promise<ConsultationDTO>;
  readAttachment(id: string, clinicId: string, doctorUserId: string, attachmentId: string): Promise<{ contentType: string; content: Buffer; fileName: string }>;
  deleteAttachment(id: string, clinicId: string, doctorUserId: string, attachmentId: string): Promise<void>;
}
