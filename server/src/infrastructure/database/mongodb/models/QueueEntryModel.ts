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
  tokenNumber: number;
  status: QueueEntryStatus;
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
  tokenNumber: { type: Number, required: true, min: 1, validate: Number.isSafeInteger, immutable: true },
  status: { type: String, required: true, enum: Object.values(QueueEntryStatus), default: QueueEntryStatus.WAITING },
  idempotencyKey: { type: String, required: true, maxlength: 128, immutable: true },
  requestFingerprint: { type: String, required: true, immutable: true },
}, { timestamps: true, versionKey: false });

schema.index({ clinicId: 1, localDate: 1, tokenNumber: 1 }, { unique: true, name: "uniq_clinic_day_token" });
schema.index({ clinicId: 1, idempotencyKey: 1 }, { unique: true, name: "uniq_clinic_queue_idempotency" });
schema.index({ appointmentId: 1 }, { unique: true, partialFilterExpression: { appointmentId: { $type: "objectId" } }, name: "uniq_appointment_queue_entry" });
schema.index({ clinicId: 1, localDate: 1, doctorUserId: 1, tokenNumber: 1 });

export const QueueEntryModel = model<IQueueEntryDocument>("QueueEntry", schema);
