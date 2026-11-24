import { Document, model, Schema, Types } from "mongoose";

export const PATIENT_HEALTH_RECORD_CATEGORIES = ["DENTAL_X_RAYS", "MEDICAL_REPORTS", "DENTAL_REPORTS", "PRESCRIPTIONS", "LAB_REPORTS", "PREVIOUS_TREATMENT_RECORDS", "OTHER_DOCUMENTS"] as const;
export type PatientHealthRecordCategory = typeof PATIENT_HEALTH_RECORD_CATEGORIES[number];

export interface IPatientHealthRecordDocument extends Document {
  _id: Types.ObjectId;
  patientUserId: Types.ObjectId;
  category: PatientHealthRecordCategory | null;
  fileName: string;
  contentType: string;
  documentKey: string;
  fileSize: number;
  uploadedAt: Date;
}

const schema = new Schema<IPatientHealthRecordDocument>({
  patientUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  category: { type: String, enum: PATIENT_HEALTH_RECORD_CATEGORIES, default: null },
  fileName: { type: String, required: true, maxlength: 180 },
  contentType: { type: String, enum: ["application/pdf", "image/jpeg", "image/png"], required: true },
  documentKey: { type: String, required: true, immutable: true },
  fileSize: { type: Number, required: true, min: 1, max: 10 * 1024 * 1024 },
  uploadedAt: { type: Date, required: true, default: Date.now, immutable: true },
}, { versionKey: false });
schema.index({ patientUserId: 1, uploadedAt: -1 });

export const PatientHealthRecordModel = model<IPatientHealthRecordDocument>("PatientHealthRecord", schema);
