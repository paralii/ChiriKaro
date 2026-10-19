import { Document, model, Schema, Types } from "mongoose";

export type DentistVerificationStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED";

export type DentistDocumentStatus = "PENDING" | "APPROVED" | "REJECTED";

export type DentistGender = "MALE" | "FEMALE";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface IDentistWorkingHour {
  day: DayOfWeek;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

export interface IDentistDocumentMeta {
  documentType: string;
  documentUrl: string;
  status: DentistDocumentStatus;
  uploadedAt: Date;
  verifiedAt?: Date | null;
  rejectionReason?: string | null;
}

export interface IDentistProfile extends Document {
  _id: Types.ObjectId;

  userId: Types.ObjectId;
  clinicId: Types.ObjectId;

  firstName: string;
  lastName: string;

  gender?: DentistGender | null;
  dateOfBirth?: Date | null;

  professionalTitle?: string | null;
  qualifications: string[];
  yearsOfExperience?: number | null;

  registrationNumber?: string | null;
  registrationAuthority?: string | null;
  specializations: string[];
  procedures: string[];

  workingHours: IDentistWorkingHour[];

  verificationStatus: DentistVerificationStatus;
  documents: IDentistDocumentMeta[];

  createdAt: Date;
  updatedAt: Date;
}

const dentistWorkingHourSchema = new Schema<IDentistWorkingHour>(
  {
    day: {
      type: String,
      enum: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ],
      required: true,
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
    startTime: {
      type: String,
      default: "09:00",
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    endTime: {
      type: String,
      default: "17:00",
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
  },
  { _id: false },
);

const dentistDocumentSchema = new Schema<IDentistDocumentMeta>(
  {
    documentType: {
      type: String,
      required: true,
      trim: true,
    },
    documentUrl: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: false },
);

const dentistProfileSchema = new Schema<IDentistProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      immutable: true,
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"],
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
      validate: {
        validator: (value: Date | null) =>
          value === null || value <= new Date(),
        message: "Date of birth cannot be in the future",
      },
    },
    professionalTitle: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },
    qualifications: {
      type: [String],
      default: [],
    },
    yearsOfExperience: {
      type: Number,
      default: null,
      min: 0,
      max: 80,
      validate: {
        validator: (value: number | null) =>
          value === null ||
          (Number.isInteger(value) && value >= 0 && value <= 80),
        message: "Years of experience must be an integer between 0 and 80",
      },
    },

    registrationNumber: {
      type: String,
      default: null,
      trim: true,
    },
    registrationAuthority: {
      type: String,
      default: null,
      trim: true,
    },

    specializations: {
      type: [String],
      default: [],
    },
    procedures: {
      type: [String],
      default: [],
    },

    workingHours: {
      type: [dentistWorkingHourSchema],
      default: [],
      validate: {
        validator: (hours: IDentistWorkingHour[]) =>
          new Set(hours.map((hour) => hour.day)).size === hours.length,
        message: "Working hours must not contain duplicate days",
      },
    },

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

    documents: {
      type: [dentistDocumentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const DentistModel = model<IDentistProfile>(
  "Dentist",
  dentistProfileSchema,
);
