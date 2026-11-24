import { Document, model, Schema, Types } from "mongoose";
import { SettlementStatus } from "@domain/enum/settlement-status.enum.ts";

export interface ISettlementAllocation { paymentId: Types.ObjectId; amountMinor: number }
export interface ISettlementDocument extends Document {
  _id: Types.ObjectId; clinicId: Types.ObjectId; allocations: ISettlementAllocation[];
  totalAmountMinor: number; currency: "INR"; status: SettlementStatus;
  allocationsActive: boolean;
  externalPayoutReference: string | null; administrativeNote: string | null; failureReason: string | null;
  createdBy: Types.ObjectId; completedBy: Types.ObjectId | null; failedBy: Types.ObjectId | null;
  createdAt: Date; updatedAt: Date; completedAt: Date | null; failedAt: Date | null;
}
const allocationSchema = new Schema<ISettlementAllocation>({
  paymentId: { type: Schema.Types.ObjectId, ref: "AppointmentPayment", required: true },
  amountMinor: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
}, { _id: false });
const schema = new Schema<ISettlementDocument>({
  clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, immutable: true },
  allocations: { type: [allocationSchema], required: true },
  totalAmountMinor: { type: Number, required: true, min: 1, validate: Number.isSafeInteger, immutable: true },
  currency: { type: String, required: true, enum: ["INR"], default: "INR", immutable: true },
  status: { type: String, required: true, enum: Object.values(SettlementStatus), default: SettlementStatus.PENDING },
  allocationsActive: { type: Boolean, required: true, default: true },
  externalPayoutReference: { type: String, default: null, trim: true, maxlength: 200 },
  administrativeNote: { type: String, default: null, trim: true, maxlength: 2000, immutable: true },
  failureReason: { type: String, default: null, trim: true, maxlength: 1000 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  completedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  failedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  completedAt: { type: Date, default: null }, failedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });
schema.index({ clinicId: 1, createdAt: -1 });
schema.index({ status:  1, createdAt: -1 });
schema.index({ "allocations.paymentId": 1 }, { unique: true, partialFilterExpression: { allocationsActive: true }, name: "uniq_active_settlement_payment_allocation" });
export const SettlementModel = model<ISettlementDocument>("Settlement", schema);
