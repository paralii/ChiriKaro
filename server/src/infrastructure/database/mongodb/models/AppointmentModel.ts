import { Document, model, Schema, Types } from "mongoose";
import { AppointmentStatus } from "@domain/enum/appointment-status.enum.ts";

export interface IAppointmentDocument extends Document {
  _id: Types.ObjectId;
  patientUserId: Types.ObjectId;
  clinicId: Types.ObjectId;
  doctorUserId: Types.ObjectId;
  clinicNameSnapshot: string;
  doctorNameSnapshot: string;
  localDate: string;
  timeZone: string;
  startsAt: Date;
  endsAt: Date;
  localStartTime: string;
  localEndTime: string;
  feeAmountMinor: number;
  feeCurrency: string;
  status: AppointmentStatus;
  idempotencyKey: string;
  requestFingerprint: string;
  holdExpiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointmentDocument>({
  patientUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, immutable: true },
  doctorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  clinicNameSnapshot: { type: String, required: true, maxlength: 150 },
  doctorNameSnapshot: { type: String, required: true, maxlength: 200 },
  localDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  timeZone: { type: String, required: true },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  localStartTime: { type: String, required: true },
  localEndTime: { type: String, required: true },
  feeAmountMinor: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
  feeCurrency: { type: String, required: true, enum: ["INR"] },
  status: { type: String, required: true, enum: Object.values(AppointmentStatus), default: AppointmentStatus.PENDING_PAYMENT },
  idempotencyKey: { type: String, required: true, maxlength: 128 },
  requestFingerprint: { type: String, required: true },
  holdExpiresAt: { type: Date, required: true },
}, { timestamps: true, versionKey: false });

appointmentSchema.index({ patientUserId: 1, idempotencyKey: 1 }, { unique: true, name: "uniq_patient_idempotency_key" });
appointmentSchema.index({ patientUserId: 1, createdAt: -1 });
appointmentSchema.index({ clinicId: 1, doctorUserId: 1, localDate: 1, startsAt: 1 });

export const AppointmentModel = model<IAppointmentDocument>("Appointment", appointmentSchema);
