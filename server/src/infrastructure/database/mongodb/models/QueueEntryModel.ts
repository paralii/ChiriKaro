import { Document, model, Schema, Types } from "mongoose";
import { QueueEntryStatus } from "@domain/enum/queue-entry-status.enum.ts";

export interface IQueueEntryDocument extends Document {
  _id: Types.ObjectId;
  clinicId: Types.ObjectId;
  doctorUserId: Types.ObjectId;
  localDate: string;
  kind: "WALK_IN" | "APPOINTMENT";
  appointmentId: Types.ObjectId | null;
  patientUserId: Types.ObjectId | null;
  patientNameSnapshot: string;
  doctorNameSnapshot: string;
  clinicNameSnapshot: string;
  timeZone: string;
  tokenNumber: number;
  status: QueueEntryStatus;
  createdByUserId: Types.ObjectId;
  createdByRole: string;
  statusHistory: Array<{ fromStatus: QueueEntryStatus | null; toStatus: QueueEntryStatus; actorUserId: Types.ObjectId; actorRole: string; changedAt: Date }>;
  idempotencyKey: string;
  requestFingerprint: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IQueueEntryDocument>({
  clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, immutable: true },
  doctorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  localDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  kind: { type: String, required: true, enum: ["WALK_IN", "APPOINTMENT"], immutable: true },
  appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", default: null, immutable: true },
  patientUserId: { type: Schema.Types.ObjectId, ref: "User", default: null, immutable: true },
  patientNameSnapshot: { type: String, required: true, trim: true, maxlength: 120, immutable: true },
  doctorNameSnapshot: { type: String, required: true, trim: true, maxlength: 200, immutable: true },
  clinicNameSnapshot: { type: String, required: true, trim: true, maxlength: 150, immutable: true },
  timeZone: { type: String, required: true, immutable: true },
  tokenNumber: { type: Number, required: true, min: 1, validate: Number.isSafeInteger, immutable: true },
  status: { type: String, required: true, enum: Object.values(QueueEntryStatus), default: QueueEntryStatus.WAITING },
  createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  createdByRole: { type: String, required: true, immutable: true },
  statusHistory: { type: [{
    fromStatus: { type: String, enum: [...Object.values(QueueEntryStatus), null], default: null },
    toStatus: { type: String, enum: Object.values(QueueEntryStatus), required: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorRole: { type: String, required: true },
    changedAt: { type: Date, required: true },
  }], required: true, default: [] },
  idempotencyKey: { type: String, required: true, maxlength: 128, immutable: true },
  requestFingerprint: { type: String, required: true, immutable: true },
}, { timestamps: true, versionKey: false });

schema.index({ clinicId: 1, localDate: 1, tokenNumber: 1 }, { unique: true, name: "uniq_clinic_day_token" });
schema.index({ clinicId: 1, idempotencyKey: 1 }, { unique: true, name: "uniq_clinic_queue_idempotency" });
schema.index({ appointmentId: 1 }, { unique: true, partialFilterExpression: { appointmentId: { $type: "objectId" } }, name: "uniq_appointment_queue_entry" });
schema.index({ clinicId: 1, localDate: 1, doctorUserId: 1, tokenNumber: 1 });

export const QueueEntryModel = model<IQueueEntryDocument>("QueueEntry", schema);
