import { Document, model, Schema, Types } from "mongoose";

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
    },
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true
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
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel = model<IUserDocument>("User", userSchema);