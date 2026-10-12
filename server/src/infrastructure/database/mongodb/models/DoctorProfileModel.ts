import { Document, model, Schema, Types } from "mongoose";

export type DoctorVerificationStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED";

export interface IDoctorWorkingHour {
  day: string;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

export interface IDoctorDocumentMeta {
  documentType: string;
  documentUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  uploadedAt: Date;
  verifiedAt?: Date | null;
  rejectionReason?: string | null;
}

export interface IDoctorProfile extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  clinicId: Types.ObjectId;
  firstName: string;
  lastName: string;
  phone?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  profilePhoto?: string | null;
  professionalTitle?: string | null;
  qualification?: string | null;
  yearsOfExperience?: number | null;
  registrationNumber?: string | null;
  registrationAuthority?: string | null;
  bio?: string | null;
  specializations: string[];
  procedures: string[];
  workingHours: IDoctorWorkingHour[];
  consultationFee?: number | null;
  slotDuration: number;
  bufferMinutes: number;
  verificationStatus: DoctorVerificationStatus;
  onboardingProgress: number;
  documents: IDoctorDocumentMeta[];
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const doctorWorkingHourSchema = new Schema<IDoctorWorkingHour>(
  {
    day: { type: String, required: true, trim: true },
    isOpen: { type: Boolean, default: false },
    startTime: { type: String, default: "09:00" },
    endTime: { type: String, default: "17:00" },
  },
  { _id: false },
);

const doctorDocumentSchema = new Schema<IDoctorDocumentMeta>(
  {
    documentType: { type: String, required: true, trim: true },
    documentUrl: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    uploadedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
  },
  { _id: false },
);

const doctorProfileSchema = new Schema<IDoctorProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    phone: { type: String, default: null },
    gender: { type: String, default: null },
    dateOfBirth: { type: String, default: null },
    profilePhoto: { type: String, default: null },
    professionalTitle: { type: String, default: null },
    qualification: { type: String, default: null },
    yearsOfExperience: { type: Number, default: null },
    registrationNumber: { type: String, default: null },
    registrationAuthority: { type: String, default: null },
    bio: { type: String, default: null },
    specializations: { type: [String], default: [] },
    procedures: { type: [String], default: [] },
    workingHours: { type: [doctorWorkingHourSchema], default: [] },
    consultationFee: { type: Number, default: null },
    slotDuration: { type: Number, default: 30, min: 5, max: 180 },
    bufferMinutes: { type: Number, default: 10, min: 0, max: 120 },
    verificationStatus: {
      type: String,
      enum: [
        "NOT_STARTED",
        "IN_PROGRESS",
        "PENDING_VERIFICATION",
        "VERIFIED",
        "REJECTED",
      ],
      default: "NOT_STARTED",
    },
    onboardingProgress: { type: Number, default: 0 },
    documents: { type: [doctorDocumentSchema], default: [] },
    rejectionReason: { type: String, default: null },
  },
  {
    timestamps: true,
  },
);

export const DoctorProfileModel = model<IDoctorProfile>(
  "DoctorProfile",
  doctorProfileSchema,
);
