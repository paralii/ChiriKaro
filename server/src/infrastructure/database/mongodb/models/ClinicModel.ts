import { Document, model, Schema, Types } from "mongoose";
import { ClinicStatus } from "../../../../domain/entities/clinic.entity.js";

export interface IClinicWorkingHour {
  day: string;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

export interface IClinicDocument {
  documentType: string;
  documentKey: string;
  uploadedAt: Date;
}

export interface IClinic extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  ownerName?: string | null;
  contactEmail?: string | null;
  registrationNumber?: string | null;
  clinicType?: string | null;
  logoUrl?: string | null;
  ownerAdminId?: Types.ObjectId | null;
  specializations: string[];
  workingHours: IClinicWorkingHour[];
  documents: IClinicDocument[];
  status: ClinicStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clinicWorkingHourSchema = new Schema<IClinicWorkingHour>(
  {
    day: { type: String, required: true, trim: true },
    isOpen: { type: Boolean, default: false },
    startTime: { type: String, default: "09:00" },
    endTime: { type: String, default: "17:00" },
  },
  { _id: false },
);

const clinicDocumentSchema = new Schema<IClinicDocument>(
  {
    documentType: { type: String, required: true, trim: true },
    documentKey: { type: String, required: true, trim: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const clinicSchema = new Schema<IClinic>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    city: {
      type: String,
      trim: true,
      default: null,
    },
    state: {
      type: String,
      trim: true,
      default: null,
    },
    pincode: {
      type: String,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    ownerName: {
      type: String,
      trim: true,
      default: null,
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    registrationNumber: {
      type: String,
      trim: true,
      default: null,
    },
    clinicType: {
      type: String,
      trim: true,
      default: null,
    },
    logoUrl: {
      type: String,
      trim: true,
      default: null,
    },
    ownerAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    specializations: { type: [String], default: [] },
    workingHours: { type: [clinicWorkingHourSchema], default: [] },
    documents: { type: [clinicDocumentSchema], default: [] },
    status: {
      type: String,
      enum: Object.values(ClinicStatus),
      default: ClinicStatus.PENDING,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const ClinicModel = model<IClinic>("Clinic", clinicSchema);