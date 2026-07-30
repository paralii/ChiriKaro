import { Document, model, Schema, Types } from "mongoose";
import { Role } from "../../../../domain/value-objects/Role.js";
import { UserStatus } from "../../../../shared/enums/user-statues.enum.js";

export interface IUserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: Role;
  status: UserStatus;
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
      enum: Object.values(Role),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.INVITED,
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