import { Types } from "mongoose";
import type { ConsultationRecord } from "@domain/entities/consultation.entity.ts";
import type { IConsultationRepository } from "@application/interfaces/repositories/IConsultationRepository.ts";
import { ConsultationModel, type IConsultationDocument } from "@infrastructure/database/mongodb/models/ConsultationModel.ts";

export class ConsultationRepository implements IConsultationRepository {
  async findByQueueEntry(queueEntryId: string) {
    if (!Types.ObjectId.isValid(queueEntryId)) return null;
    const doc = await ConsultationModel.findOne({ queueEntryId: new Types.ObjectId(queueEntryId) }).exec();
    return doc ? this.toRecord(doc) : null;
  }
  async findById(id: string, clinicId: string) {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(clinicId)) return null;
    const doc = await ConsultationModel.findOne({ _id: new Types.ObjectId(id), clinicId: new Types.ObjectId(clinicId) }).exec();
    return doc ? this.toRecord(doc) : null;
  }
  async listForPatient(patientUserId: string, clinicId: string) {
    if (!Types.ObjectId.isValid(patientUserId) || !Types.ObjectId.isValid(clinicId)) return [];
    const docs = await ConsultationModel.find({ patientUserId: new Types.ObjectId(patientUserId), clinicId: new Types.ObjectId(clinicId) }).sort({ createdAt: -1 }).limit(50).exec();
    return docs.map((doc) => this.toRecord(doc));
  }
  async create(record: ConsultationRecord) {
    const doc = await ConsultationModel.create({ _id: new Types.ObjectId(record.id), queueEntryId: new Types.ObjectId(record.queueEntryId), clinicId: new Types.ObjectId(record.clinicId), doctorUserId: new Types.ObjectId(record.doctorUserId), patientUserId: record.patientUserId ? new Types.ObjectId(record.patientUserId) : null, patientNameSnapshot: record.patientNameSnapshot, appointmentId: record.appointmentId ? new Types.ObjectId(record.appointmentId) : null, visitDetails: record.visitDetails, status: record.status, medicalHistorySnapshot: record.medicalHistorySnapshot, data: record.data, attachments: record.attachments, startedAt: record.startedAt, startedBy: new Types.ObjectId(record.startedBy), completedAt: record.completedAt, completedBy: record.completedBy ? new Types.ObjectId(record.completedBy) : null });
    return this.toRecord(doc);
  }
  async saveDraft(id: string, clinicId: string, doctorUserId: string, data: ConsultationRecord["data"], history: ConsultationRecord["medicalHistorySnapshot"]) {
    if (![id, clinicId, doctorUserId].every(Types.ObjectId.isValid)) return null;
    const doc = await ConsultationModel.findOneAndUpdate({ _id: new Types.ObjectId(id), clinicId: new Types.ObjectId(clinicId), doctorUserId: new Types.ObjectId(doctorUserId), status: "IN_PROGRESS" }, { $set: { data, medicalHistorySnapshot: history } }, { returnDocument: "after", runValidators: true }).exec();
    return doc ? this.toRecord(doc) : null;
  }
  async addAttachment(id: string, clinicId: string, doctorUserId: string, attachment: ConsultationRecord["attachments"][number]) {
    if (![id, clinicId, doctorUserId].every(Types.ObjectId.isValid)) return null;
    const doc = await ConsultationModel.findOneAndUpdate({ _id: new Types.ObjectId(id), clinicId: new Types.ObjectId(clinicId), doctorUserId: new Types.ObjectId(doctorUserId), status: "IN_PROGRESS" }, { $push: { attachments: { _id: new Types.ObjectId(attachment.id), ...attachment, uploadedBy: new Types.ObjectId(attachment.uploadedBy) } } }, { returnDocument: "after", runValidators: true }).exec();
    return doc ? this.toRecord(doc) : null;
  }
  async removeAttachment(id: string, clinicId: string, doctorUserId: string, attachmentId: string) {
    if (![id, clinicId, doctorUserId, attachmentId].every(Types.ObjectId.isValid)) return null;
    const doc = await ConsultationModel.findOne({ _id: new Types.ObjectId(id), clinicId: new Types.ObjectId(clinicId), doctorUserId: new Types.ObjectId(doctorUserId), status: "IN_PROGRESS", "attachments._id": new Types.ObjectId(attachmentId) }).exec();
    const attachment = doc?.attachments.find((item) => item._id.toString() === attachmentId);
    if (!doc || !attachment) return null;
    doc.attachments = doc.attachments.filter((item) => item._id.toString() !== attachmentId) as typeof doc.attachments;
    await doc.save();
    return { record: this.toRecord(doc), documentKey: attachment.documentKey };
  }
  async finalize(id: string, clinicId: string, doctorUserId: string, actorUserId: string, completedAt: Date) {
    if (![id, clinicId, doctorUserId, actorUserId].every(Types.ObjectId.isValid)) return null;
    const doc = await ConsultationModel.findOneAndUpdate({ _id: new Types.ObjectId(id), clinicId: new Types.ObjectId(clinicId), doctorUserId: new Types.ObjectId(doctorUserId), status: "IN_PROGRESS" }, { $set: { status: "COMPLETED", completedAt, completedBy: new Types.ObjectId(actorUserId) } }, { returnDocument: "after" }).exec();
    return doc ? this.toRecord(doc) : null;
  }
  private toRecord(doc: IConsultationDocument): ConsultationRecord {
    return { id: doc._id.toString(), queueEntryId: doc.queueEntryId.toString(), clinicId: doc.clinicId.toString(), doctorUserId: doc.doctorUserId.toString(), patientUserId: doc.patientUserId?.toString() ?? null, patientNameSnapshot: doc.patientNameSnapshot, appointmentId: doc.appointmentId?.toString() ?? null, visitDetails: doc.visitDetails, status: doc.status, medicalHistorySnapshot: { existingConditions: doc.medicalHistorySnapshot.existingConditions ?? [], allergies: doc.medicalHistorySnapshot.allergies ?? [], medications: doc.medicalHistorySnapshot.medications ?? [], previousSurgeries: doc.medicalHistorySnapshot.previousSurgeries ?? [], dentalHistory: doc.medicalHistorySnapshot.dentalHistory ?? "", remarks: doc.medicalHistorySnapshot.remarks ?? "" }, data: doc.data, attachments: doc.attachments.map((a) => ({ id: a._id.toString(), category: a.category, fileName: a.fileName, contentType: a.contentType, documentKey: a.documentKey, uploadedBy: a.uploadedBy.toString(), uploadedAt: a.uploadedAt })), startedAt: doc.startedAt, startedBy: doc.startedBy.toString(), completedAt: doc.completedAt, completedBy: doc.completedBy?.toString() ?? null, createdAt: doc.createdAt, updatedAt: doc.updatedAt };
  }
}
