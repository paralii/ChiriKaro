import { Document, model, Schema, Types } from "mongoose";
import { Role } from "../../../../domain/value-objects/Role.js";
import { InvitationStatus } from "../../../../domain/entities/Invitation.entity.js";

export interface IInvitation extends Document {
  _id: Types.ObjectId;
  email: string;
  role: Role;
  clinicId: Types.ObjectId;
  invitedBy: Types.ObjectId;
  token: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    status: {
      type: String,
      enum: Object.values(InvitationStatus),
      default: InvitationStatus.PENDING,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

invitationSchema.index({ email: 1, status: 1 });

export const InvitationModel = model<IInvitation>(
  "Invitation",
  invitationSchema
);