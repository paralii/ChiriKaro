import { Schema, model } from "mongoose";
import type { Document } from "mongoose";

export interface IPasswordResetTokenDocument extends Document {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

const passwordResetTokenSchema =
  new Schema<IPasswordResetTokenDocument>(
    {
      userId: {
        type: String,
        required: true,
        unique: true,
      },
      tokenHash: {
        type: String,
        required: true,
        unique: true,
      },
      expiresAt: {
        type: Date,
        required: true,
      },
    },
    {
      timestamps: true,
    },
  );

export const PasswordResetTokenModel = model<IPasswordResetTokenDocument>(
  "PasswordResetToken",
  passwordResetTokenSchema,
);