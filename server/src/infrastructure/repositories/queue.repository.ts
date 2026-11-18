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
        tokenNumber: entry.tokenNumber,
        status: entry.status,
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
      tokenNumber: doc.tokenNumber,
      status: doc.status,
      idempotencyKey: doc.idempotencyKey,
      requestFingerprint: doc.requestFingerprint,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
