import { Document, model, Schema, Types } from "mongoose";
import type { MedicalHistory } from "@domain/entities/consultation.entity.ts";

export interface IUserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: string;
  status: string;
  clinicId?: Types.ObjectId | null;
  googleId?: string;
  avatar?: string | null;
  medicalHistory?: MedicalHistory;
  medicalHistoryUpdatedBy?: Types.ObjectId | null;
  medicalHistoryUpdatedAt?: Date | null;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      default: null,
    },
    googleId: {
      type: String,
      select: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    medicalHistory: {
      type: new Schema({
        existingConditions: { type: [String], default: [] }, allergies: { type: [String], default: [] }, medications: { type: [String], default: [] },
        previousSurgeries: { type: [String], default: [] }, dentalHistory: { type: String, default: "" }, remarks: { type: String, default: "" },
      }, { _id: false }),
      default: () => ({}),
    },
    medicalHistoryUpdatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    medicalHistoryUpdatedAt: { type: Date, default: null },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const UserModel = model<IUserDocument>("User", userSchema);
