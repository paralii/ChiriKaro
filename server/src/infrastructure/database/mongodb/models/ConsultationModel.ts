import { Document, model, Schema, Types } from "mongoose";
import type { ConsultationData, ConsultationRecord, MedicalHistory } from "@domain/entities/consultation.entity.ts";

export interface IConsultationDocument extends Document {
  _id: Types.ObjectId; queueEntryId: Types.ObjectId; clinicId: Types.ObjectId; doctorUserId: Types.ObjectId;
  patientUserId: Types.ObjectId | null; patientNameSnapshot: string; appointmentId: Types.ObjectId | null;
  visitDetails: ConsultationRecord["visitDetails"];
  status: ConsultationRecord["status"]; medicalHistorySnapshot: MedicalHistory; data: ConsultationData;
  attachments: Array<{ _id: Types.ObjectId; category: string; fileName: string; contentType: string; documentKey: string; uploadedBy: Types.ObjectId; uploadedAt: Date }>; startedAt: Date; startedBy: Types.ObjectId;
  completedAt: Date | null; completedBy: Types.ObjectId | null; createdAt: Date; updatedAt: Date;
}

const historySchema = new Schema<MedicalHistory>({
  existingConditions: { type: [String], default: [] }, allergies: { type: [String], default: [] }, medications: { type: [String], default: [] },
  previousSurgeries: { type: [String], default: [] }, dentalHistory: { type: String, default: "" }, remarks: { type: String, default: "" },
}, { _id: false });

const dataSchema = new Schema<ConsultationData>({
  chiefComplaint: { type: String, default: "" }, symptoms: { type: [String], default: [] }, painLevel: { type: Number, min: 0, max: 10, default: null },
  examinationFindings: { type: String, default: "" }, clinicalNotes: { type: String, default: "" },
  dentalChart: { type: [{ toothNumber: { type: String, required: true }, condition: { type: String, default: "" }, affectedSurface: { type: String, default: "" }, observations: { type: String, default: "" } }], default: [] },
  diagnoses: { type: [{ diagnosis: { type: String, required: true }, affectedTeeth: { type: [String], default: [] }, severity: { type: String, default: "" }, remarks: { type: String, default: "" } }], default: [] },
  treatmentPlan: { type: [{ procedure: { type: String, required: true }, affectedTeeth: { type: [String], default: [] }, estimatedCost: { type: Number, min: 0, default: null }, numberOfSessions: { type: Number, min: 1, default: null }, instructions: { type: String, default: "" } }], default: [] },
  prescriptions: { type: [{ medicine: { type: String, required: true }, dosage: { type: String, default: "" }, frequency: { type: String, default: "" }, duration: { type: String, default: "" }, instructions: { type: String, default: "" } }], default: [] },
}, { _id: false });
const attachmentSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true, default: () => new Types.ObjectId() },
  category: { type: String, required: true }, fileName: { type: String, required: true }, contentType: { type: String, required: true },
  documentKey: { type: String, required: true }, uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, uploadedAt: { type: Date, required: true },
}, { _id: false });

const schema = new Schema<IConsultationDocument>({
  queueEntryId: { type: Schema.Types.ObjectId, ref: "QueueEntry", required: true, immutable: true, unique: true },
  clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, immutable: true },
  doctorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  patientUserId: { type: Schema.Types.ObjectId, ref: "User", default: null, immutable: true },
  patientNameSnapshot: { type: String, required: true, immutable: true },
  appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", default: null, immutable: true },
  visitDetails: { type: new Schema({ localDate: { type: String, required: true }, localStartTime: { type: String, default: null }, localEndTime: { type: String, default: null }, tokenNumber: { type: Number, required: true }, clinicName: { type: String, required: true } }, { _id: false }), required: true, immutable: true },
  status: { type: String, enum: ["IN_PROGRESS", "COMPLETED"], default: "IN_PROGRESS" },
  medicalHistorySnapshot: { type: historySchema, default: () => ({}) }, data: { type: dataSchema, default: () => ({}) },
  attachments: { type: [attachmentSchema], default: [] },
  startedAt: { type: Date, required: true, immutable: true }, startedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  completedAt: { type: Date, default: null }, completedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true, versionKey: false, optimisticConcurrency: true });
schema.index({ patientUserId: 1, createdAt: -1 });
schema.index({ clinicId: 1, patientUserId: 1, createdAt: -1 });
export const ConsultationModel = model<IConsultationDocument>("Consultation", schema);
