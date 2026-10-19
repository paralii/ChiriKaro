import { Document, model, Schema, Types } from "mongoose";
import { Role } from "@domain/value-objects/Role.ts";
import { InvitationStatus } from "@domain/enum/invitation-status.enum.ts";

export interface IInvitationDocument extends Document {
  _id: Types.ObjectId;
  email: string;
  role: Role;
  clinicId: Types.ObjectId;
  invitedBy: Types.ObjectId;
  tokenHash: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitationDocument>(
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
    tokenHash: {
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

export const InvitationModel = model<IInvitationDocument>(
  "Invitations",
  invitationSchema
);