import { Types } from "mongoose";
import type { QueueEntryRecord } from "@domain/entities/booking-workflow.entity.ts";
import type { IQueueRepository } from "@application/interfaces/repositories/IQueueRepository.ts";
import { QueueEntryModel, type IQueueEntryDocument } from "@infrastructure/database/mongodb/models/QueueEntryModel.ts";
import { ConflictError } from "@shared/errors/index.ts";

export class QueueRepository implements IQueueRepository {
  async findByIdempotencyKey(clinicId: string, idempotencyKey: string): Promise<QueueEntryRecord | null> {
    const doc = await QueueEntryModel.findOne({ clinicId: new Types.ObjectId(clinicId), idempotencyKey }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByAppointmentId(appointmentId: string): Promise<QueueEntryRecord | null> {
    const doc = await QueueEntryModel.findOne({ appointmentId: new Types.ObjectId(appointmentId) }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async create(entry: QueueEntryRecord): Promise<QueueEntryRecord> {
    try {
      const doc = await QueueEntryModel.create({
        _id: new Types.ObjectId(entry.id),
        clinicId: new Types.ObjectId(entry.clinicId),
        doctorUserId: new Types.ObjectId(entry.doctorUserId),
        localDate: entry.localDate,
        kind: entry.kind,
        appointmentId: entry.appointmentId ? new Types.ObjectId(entry.appointmentId) : null,
        patientUserId: entry.patientUserId ? new Types.ObjectId(entry.patientUserId) : null,
        patientNameSnapshot: entry.patientNameSnapshot,
        doctorNameSnapshot: entry.doctorNameSnapshot,
        clinicNameSnapshot: entry.clinicNameSnapshot,
        timeZone: entry.timeZone,
        tokenNumber: entry.tokenNumber,
        status: entry.status,
        createdByUserId: new Types.ObjectId(entry.createdByUserId),
        createdByRole: entry.createdByRole,
        statusHistory: entry.statusHistory.map((event) => ({ ...event, actorUserId: new Types.ObjectId(event.actorUserId) })),
        idempotencyKey: entry.idempotencyKey,
        requestFingerprint: entry.requestFingerprint,
      });
      return this.toDomain(doc);
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw new ConflictError("A queue entry already exists for this request or token");
      throw error;
    }
  }

  async listForClinic(clinicId: string, localDate: string, doctorUserId?: string): Promise<QueueEntryRecord[]> {
    const query: Record<string, unknown> = { clinicId: new Types.ObjectId(clinicId), localDate };
    if (doctorUserId) query.doctorUserId = new Types.ObjectId(doctorUserId);
    const docs = await QueueEntryModel.find(query).sort({ tokenNumber: 1 }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findForPatient(patientUserId: string): Promise<QueueEntryRecord[]> {
    const docs = await QueueEntryModel.find({ patientUserId: new Types.ObjectId(patientUserId) }).sort({ createdAt: -1, _id: -1 }).limit(20).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByIdInClinic(queueEntryId: string, clinicId: string, localDate: string): Promise<QueueEntryRecord | null> {
    if (!Types.ObjectId.isValid(queueEntryId) || !Types.ObjectId.isValid(clinicId)) return null;
    const doc = await QueueEntryModel.findOne({ _id: new Types.ObjectId(queueEntryId), clinicId: new Types.ObjectId(clinicId), localDate }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByIdForClinic(queueEntryId: string, clinicId: string): Promise<QueueEntryRecord | null> {
    if (!Types.ObjectId.isValid(queueEntryId) || !Types.ObjectId.isValid(clinicId)) return null;
    const doc = await QueueEntryModel.findOne({ _id: new Types.ObjectId(queueEntryId), clinicId: new Types.ObjectId(clinicId) }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async transitionStatus(input: { queueEntryId: string; clinicId: string; localDate: string; expectedStatus: QueueEntryRecord["status"]; nextStatus: QueueEntryRecord["status"]; actorUserId: string; actorRole: string; changedAt: Date }): Promise<QueueEntryRecord | null> {
    if (!Types.ObjectId.isValid(input.queueEntryId) || !Types.ObjectId.isValid(input.clinicId) || !Types.ObjectId.isValid(input.actorUserId)) return null;
    const doc = await QueueEntryModel.findOneAndUpdate({
      _id: new Types.ObjectId(input.queueEntryId), clinicId: new Types.ObjectId(input.clinicId),
      localDate: input.localDate, status: input.expectedStatus,
    }, {
      $set: { status: input.nextStatus },
      $push: { statusHistory: { fromStatus: input.expectedStatus, toStatus: input.nextStatus, actorUserId: new Types.ObjectId(input.actorUserId), actorRole: input.actorRole, changedAt: input.changedAt } },
    }, { returnDocument: "after" }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async transitionStatusForClinic(input: { queueEntryId: string; clinicId: string; expectedStatus: QueueEntryRecord["status"]; nextStatus: QueueEntryRecord["status"]; actorUserId: string; actorRole: string; changedAt: Date }): Promise<QueueEntryRecord | null> {
    if (!Types.ObjectId.isValid(input.queueEntryId) || !Types.ObjectId.isValid(input.clinicId) || !Types.ObjectId.isValid(input.actorUserId)) return null;
    const doc = await QueueEntryModel.findOneAndUpdate({ _id: new Types.ObjectId(input.queueEntryId), clinicId: new Types.ObjectId(input.clinicId), status: input.expectedStatus }, { $set: { status: input.nextStatus }, $push: { statusHistory: { fromStatus: input.expectedStatus, toStatus: input.nextStatus, actorUserId: new Types.ObjectId(input.actorUserId), actorRole: input.actorRole, changedAt: input.changedAt } } }, { returnDocument: "after" }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  private toDomain(doc: IQueueEntryDocument): QueueEntryRecord {
    return {
      id: doc._id.toString(),
      clinicId: doc.clinicId.toString(),
      doctorUserId: doc.doctorUserId.toString(),
      localDate: doc.localDate,
      kind: doc.kind,
      appointmentId: doc.appointmentId?.toString() ?? null,
      patientUserId: doc.patientUserId?.toString() ?? null,
      patientNameSnapshot: doc.patientNameSnapshot,
      doctorNameSnapshot: doc.doctorNameSnapshot,
      clinicNameSnapshot: doc.clinicNameSnapshot,
      timeZone: doc.timeZone,
      tokenNumber: doc.tokenNumber,
      status: doc.status,
      createdByUserId: doc.createdByUserId.toString(),
      createdByRole: doc.createdByRole,
      statusHistory: doc.statusHistory.map((event) => ({ fromStatus: event.fromStatus, toStatus: event.toStatus, actorUserId: event.actorUserId.toString(), actorRole: event.actorRole, changedAt: event.changedAt })),
      idempotencyKey: doc.idempotencyKey,
      requestFingerprint: doc.requestFingerprint,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
