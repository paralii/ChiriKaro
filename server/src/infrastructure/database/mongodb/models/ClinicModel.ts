import { Document, model, Schema, Types } from "mongoose";

export interface IClinic extends Document {
  _id: Types.ObjectId;
  name: string;
  address?: string | null;
  phone?: string | null;
  ownerAdminId?: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clinicSchema = new Schema<IClinic>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    ownerAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ClinicModel = model<IClinic>("Clinic", clinicSchema);