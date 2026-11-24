import { Types } from "mongoose";
import type { IConsultationRepository } from "@application/interfaces/repositories/IConsultationRepository.ts";
import type { IAppointmentRepository } from "@application/interfaces/repositories/IAppointmentRepository.ts";
import type { IQueueRepository } from "@application/interfaces/repositories/IQueueRepository.ts";
import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IQueueClinicContext } from "@application/interfaces/services/IQueueClinicContext.ts";
import type { IDocumentStorage } from "@application/interfaces/services/IDocumentStorage.ts";
import type { IConsultationUseCase } from "@application/interfaces/use-cases/consultation/IConsultationUseCase.ts";
import type { ConsultationData, ConsultationRecord, MedicalHistory } from "@domain/entities/consultation.entity.ts";
import { QueueEntryStatus } from "@domain/enum/queue-entry-status.enum.ts";
import { Role } from "@domain/value-objects/Role.ts";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import type { ConsultationDTO } from "@application/dto/consultation/consultation.dto.ts";
import type { Readable } from "node:stream";
import { PrescriptionPdfService } from "@application/services/prescription-pdf.service.ts";

const EMPTY_HISTORY: MedicalHistory = { existingConditions: [], allergies: [], medications: [], previousSurgeries: [], dentalHistory: "", remarks: "" };
const EMPTY_DATA: ConsultationData = { chiefComplaint: "", symptoms: [], painLevel: null, examinationFindings: "", clinicalNotes: "", dentalChart: [], diagnoses: [], treatmentPlan: [], prescriptions: [] };
const MIME_EXTENSIONS: Record<string, string> = { "application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png" };
const text = (v: unknown, field: string, max = 4000): string => { if (v === undefined || v === null || v === "") return ""; if (typeof v !== "string" || v.length > max) throw new ValidationError(`${field} must be text of at most ${max} characters`); return v.trim(); };
const strings = (v: unknown, field: string): string[] => { if (v === undefined || v === null) return []; if (!Array.isArray(v) || v.length > 100) throw new ValidationError(`${field} must be a list of at most 100 entries`); return v.map((item) => text(item, field, 300)); };
const number = (v: unknown, field: string, min: number, max: number): number | null => { if (v === undefined || v === null || v === "") return null; const n = Number(v); if (!Number.isFinite(n) || n < min || n > max) throw new ValidationError(`${field} must be between ${min} and ${max}`); return n; };
function history(v: unknown): MedicalHistory {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new ValidationError("Medical history must be an object");
  const r = v as Record<string, unknown>;
  return { existingConditions: strings(r.existingConditions, "existingConditions"), allergies: strings(r.allergies, "allergies"), medications: strings(r.medications, "medications"), previousSurgeries: strings(r.previousSurgeries, "previousSurgeries"), dentalHistory: text(r.dentalHistory, "dentalHistory"), remarks: text(r.remarks, "medical history remarks") };
}
function consultationData(v: unknown): ConsultationData {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new ValidationError("Consultation data must be an object");
  const r = v as Record<string, unknown>;
  const rows = <T>(value: unknown, name: string, parse: (x: Record<string, unknown>) => T): T[] => {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value) || value.length > 100) throw new ValidationError(`${name} must contain at most 100 entries`);
    return value.map((row) => { if (!row || typeof row !== "object" || Array.isArray(row)) throw new ValidationError(`${name} entries must be objects`); return parse(row as Record<string, unknown>); });
  };
  return { chiefComplaint: text(r.chiefComplaint, "chiefComplaint"), symptoms: strings(r.symptoms, "symptoms"), painLevel: number(r.painLevel, "painLevel", 0, 10), examinationFindings: text(r.examinationFindings, "examinationFindings"), clinicalNotes: text(r.clinicalNotes, "clinicalNotes"),
    dentalChart: rows(r.dentalChart, "dentalChart", (x) => ({ toothNumber: text(x.toothNumber, "toothNumber", 8), condition: text(x.condition, "condition", 300), affectedSurface: text(x.affectedSurface, "affectedSurface", 100), observations: text(x.observations, "observations") })),
    diagnoses: rows(r.diagnoses, "diagnoses", (x) => ({ diagnosis: text(x.diagnosis, "diagnosis", 500), affectedTeeth: strings(x.affectedTeeth, "affectedTeeth"), severity: text(x.severity, "severity", 100), remarks: text(x.remarks, "diagnosis remarks") })),
    treatmentPlan: rows(r.treatmentPlan, "treatmentPlan", (x) => ({ procedure: text(x.procedure, "procedure", 500), affectedTeeth: strings(x.affectedTeeth, "affectedTeeth"), estimatedCost: number(x.estimatedCost, "estimatedCost", 0, 100000000), numberOfSessions: number(x.numberOfSessions, "numberOfSessions", 1, 1000), instructions: text(x.instructions, "treatment instructions") })),
    prescriptions: rows(r.prescriptions, "prescriptions", (x) => {
      const medicine = text(x.medicine, "medicine", 500); const dosage = text(x.dosage, "dosage", 300); const frequency = text(x.frequency, "frequency", 300); const duration = text(x.duration, "duration", 300);
      if (!medicine || !dosage || !frequency || !duration) throw new ValidationError("Each prescription requires medicine, dosage, frequency and duration");
      return { medicine, dosage, frequency, duration, instructions: text(x.instructions, "prescription instructions") };
    }) };
}
function dto(record: ConsultationRecord): ConsultationDTO { return { ...record, attachments: record.attachments.map(({ documentKey: _key, ...attachment }) => { void _key; return attachment; }) }; }

export class ConsultationUseCase implements IConsultationUseCase {
  constructor(private readonly records: IConsultationRepository, private readonly queue: IQueueRepository, private readonly users: IUserRepository, private readonly context: IQueueClinicContext, private readonly storage: IDocumentStorage, private readonly appointments: IAppointmentRepository, private readonly prescriptionPdf = new PrescriptionPdfService()) {}
  private async authorize(clinicId: string, doctorUserId: string) { if (!Types.ObjectId.isValid(doctorUserId)) throw new BadRequestError("Doctor identity is invalid"); await this.context.getOperationalClinic(clinicId); await this.context.getVerifiedDoctor(clinicId, doctorUserId); }
  private async owned(id: string, clinicId: string, doctorUserId: string) { const item = await this.records.findById(id, clinicId); if (!item) throw new NotFoundError("Consultation"); if (item.doctorUserId !== doctorUserId) throw new ForbiddenError("Doctors can only access their own consultations"); return item; }
  private async currentHistory(patientUserId: string | null): Promise<MedicalHistory> { if (!patientUserId) return { ...EMPTY_HISTORY }; const current = await this.users.getMedicalHistory(patientUserId); return current?.history ?? { ...EMPTY_HISTORY }; }
  async open(queueEntryId: string, clinicId: string, doctorUserId: string) {
    await this.authorize(clinicId, doctorUserId);
    const entry = await this.queue.findByIdForClinic(queueEntryId, clinicId);
    if (!entry) throw new NotFoundError("Queue entry");
    if (entry.doctorUserId !== doctorUserId) throw new ForbiddenError("Doctors can only open their own queue entries");
    if (![QueueEntryStatus.WAITING, QueueEntryStatus.IN_CONSULTATION].includes(entry.status)) throw new ConflictError("This queue entry cannot be opened for consultation");
    const existing = await this.records.findByQueueEntry(entry.id);
    if (existing) return dto(existing);
    if (entry.status === QueueEntryStatus.WAITING) {
      const moved = await this.queue.transitionStatusForClinic({ queueEntryId: entry.id, clinicId, expectedStatus: QueueEntryStatus.WAITING, nextStatus: QueueEntryStatus.IN_CONSULTATION, actorUserId: doctorUserId, actorRole: Role.DOCTOR, changedAt: new Date() });
      if (!moved) throw new ConflictError("Queue status changed. Refresh and retry.");
    }
    const now = new Date();
    const appointment = entry.appointmentId ? await this.appointments.findConfirmedForQueue(entry.appointmentId, clinicId) : null;
    const record: ConsultationRecord = { id: new Types.ObjectId().toString(), queueEntryId: entry.id, clinicId, doctorUserId, patientUserId: entry.patientUserId, patientNameSnapshot: entry.patientNameSnapshot, appointmentId: entry.appointmentId, visitDetails: { localDate: entry.localDate, localStartTime: appointment?.slot.localStartTime ?? null, localEndTime: appointment?.slot.localEndTime ?? null, tokenNumber: entry.tokenNumber, clinicName: entry.clinicNameSnapshot }, status: "IN_PROGRESS", medicalHistorySnapshot: await this.currentHistory(entry.patientUserId), data: { ...EMPTY_DATA }, attachments: [], startedAt: now, startedBy: doctorUserId, completedAt: null, completedBy: null, createdAt: now, updatedAt: now };
    try { return dto(await this.records.create(record)); } catch (error) { const retry = await this.records.findByQueueEntry(entry.id); if (retry?.doctorUserId === doctorUserId) return dto(retry); throw error; }
  }
  async get(id: string, clinicId: string, doctorUserId: string) { await this.authorize(clinicId, doctorUserId); return dto(await this.owned(id, clinicId, doctorUserId)); }
  async listPatient(patientUserId: string, clinicId: string, doctorUserId: string) { await this.authorize(clinicId, doctorUserId); if (!Types.ObjectId.isValid(patientUserId)) throw new BadRequestError("Patient identity is invalid"); return (await this.records.listForPatient(patientUserId, clinicId)).map(dto); }
  async listPatientPrescriptions(patientUserId: string) {
    if (!Types.ObjectId.isValid(patientUserId)) throw new BadRequestError("Patient identity is invalid");
    const records = await this.records.listCompletedForPatient(patientUserId);
    return Promise.all(records.filter((record) => record.data.prescriptions.length > 0).map(async (record) => {
      const [doctor, clinic] = await Promise.all([this.context.getVerifiedDoctor(record.clinicId, record.doctorUserId), this.context.getOperationalClinic(record.clinicId)]);
      return { consultationId: record.id, doctorName: `${doctor.firstName} ${doctor.lastName}`, clinicName: clinic.name, prescribedAt: record.completedAt ?? record.startedAt, prescriptions: record.data.prescriptions };
    }));
  }
  private async prescriptionPdfFor(record: ConsultationRecord): Promise<Readable> {
    if (record.status !== "COMPLETED") throw new NotFoundError("Finalized prescription");
    if (!record.data.prescriptions.length) throw new NotFoundError("Prescription");
    const [clinic, doctor, patient] = await Promise.all([
      this.context.getOperationalClinic(record.clinicId),
      this.context.getVerifiedDoctor(record.clinicId, record.doctorUserId),
      record.patientUserId ? this.users.findById(record.patientUserId) : Promise.resolve(null),
    ]);
    return this.prescriptionPdf.generate({ record, clinic, doctor, patientName: patient?.name ?? record.patientNameSnapshot, patientEmail: patient?.email ?? null });
  }
  async patientPrescriptionPdf(consultationId: string, patientUserId: string) {
    if (!Types.ObjectId.isValid(consultationId) || !Types.ObjectId.isValid(patientUserId)) throw new BadRequestError("Prescription identity is invalid");
    const record = await this.records.findCompletedForPatient(consultationId, patientUserId);
    if (!record) throw new NotFoundError("Finalized prescription");
    return this.prescriptionPdfFor(record);
  }
  async doctorPrescriptionPdf(consultationId: string, clinicId: string, doctorUserId: string) {
    await this.authorize(clinicId, doctorUserId);
    const record = await this.records.findById(consultationId, clinicId);
    if (!record) throw new NotFoundError("Finalized prescription");
    if (record.doctorUserId !== doctorUserId) throw new ForbiddenError("Doctors can only access their own prescriptions");
    return this.prescriptionPdfFor(record);
  }
  async save(id: string, clinicId: string, doctorUserId: string, _actorUserId: string, data: unknown, snapshot?: unknown) { await this.authorize(clinicId, doctorUserId); const current = await this.owned(id, clinicId, doctorUserId); if (current.status !== "IN_PROGRESS") throw new ConflictError("Completed consultations are historical and cannot be changed"); const updated = await this.records.saveDraft(id, clinicId, doctorUserId, consultationData(data), history(snapshot === undefined ? current.medicalHistorySnapshot : snapshot)); if (!updated) throw new ConflictError("Consultation changed or was finalized. Refresh before saving."); return dto(updated); }
  async updateMedicalHistory(patientUserId: string, clinicId: string, doctorUserId: string, actorUserId: string, value: MedicalHistory) { await this.authorize(clinicId, doctorUserId); if (!Types.ObjectId.isValid(patientUserId)) throw new BadRequestError("Patient identity is invalid"); const updated = await this.users.updateMedicalHistory(patientUserId, actorUserId, history(value)); if (!updated) throw new NotFoundError("Patient account"); return updated; }
  async getMedicalHistory(patientUserId: string, clinicId: string, doctorUserId: string) { await this.authorize(clinicId, doctorUserId); if (!Types.ObjectId.isValid(patientUserId)) throw new BadRequestError("Patient identity is invalid"); const result = await this.users.getMedicalHistory(patientUserId); if (!result) throw new NotFoundError("Patient account"); return result; }
  async finalize(id: string, clinicId: string, doctorUserId: string, actorUserId: string) { await this.authorize(clinicId, doctorUserId); const record = await this.owned(id, clinicId, doctorUserId); if (record.status === "COMPLETED") throw new ConflictError("Consultation has already been completed"); const entry = await this.queue.findByIdForClinic(record.queueEntryId, clinicId); if (!entry || entry.status !== QueueEntryStatus.IN_CONSULTATION) throw new ConflictError("The consultation queue entry is no longer in consultation"); const completed = await this.records.finalize(id, clinicId, doctorUserId, actorUserId, new Date()); if (!completed) throw new ConflictError("Consultation changed or was already completed"); const moved = await this.queue.transitionStatusForClinic({ queueEntryId: entry.id, clinicId, expectedStatus: QueueEntryStatus.IN_CONSULTATION, nextStatus: QueueEntryStatus.COMPLETED, actorUserId, actorRole: Role.DOCTOR, changedAt: new Date() }); if (!moved) throw new ConflictError("Consultation was completed but queue completion needs reconciliation"); return dto(completed); }
  async addAttachment(id: string, clinicId: string, doctorUserId: string, actorUserId: string, fileName: string, contentType: string, content: Buffer, category: string) { await this.authorize(clinicId, doctorUserId); const record = await this.owned(id, clinicId, doctorUserId); if (record.status !== "IN_PROGRESS") throw new ConflictError("Attachments cannot be changed after finalization"); if (!MIME_EXTENSIONS[contentType]) throw new BadRequestError("Attachments must be PDF, JPEG, or PNG files"); const safeName = [...fileName.trim()].map((character) => character.charCodeAt(0) < 32 || /[\\/]/.test(character) ? "_" : character).join("").slice(0, 180); if (!safeName) throw new BadRequestError("Attachment file name is required"); if (!["X_RAY", "CLINICAL_PHOTOGRAPH", "REPORT", "SUPPORTING_DOCUMENT"].includes(category)) throw new BadRequestError("Attachment category is invalid"); const key = await this.storage.save(content, contentType); const updated = await this.records.addAttachment(id, clinicId, doctorUserId, { id: new Types.ObjectId().toString(), category, fileName: safeName, contentType, documentKey: key, uploadedBy: actorUserId, uploadedAt: new Date() }); if (!updated) { await this.storage.delete(key); throw new ConflictError("Consultation changed or was finalized before attachment was saved"); } return dto(updated); }
  async readAttachment(id: string, clinicId: string, doctorUserId: string, attachmentId: string) { await this.authorize(clinicId, doctorUserId); const record = await this.owned(id, clinicId, doctorUserId); const attachment = record.attachments.find((a) => a.id === attachmentId); if (!attachment) throw new NotFoundError("Consultation attachment"); const file = await this.storage.read(attachment.documentKey); return { contentType: file.contentType, content: file.content, fileName: attachment.fileName }; }
  async deleteAttachment(id: string, clinicId: string, doctorUserId: string, attachmentId: string) { await this.authorize(clinicId, doctorUserId); const record = await this.owned(id, clinicId, doctorUserId); if (record.status !== "IN_PROGRESS") throw new ConflictError("Attachments cannot be changed after finalization"); const removed = await this.records.removeAttachment(id, clinicId, doctorUserId, attachmentId); if (!removed) throw new NotFoundError("Consultation attachment"); await this.storage.delete(removed.documentKey); }
}
