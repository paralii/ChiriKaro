import { Document, model, Schema, Types } from "mongoose";
import { PaymentStatus } from "@domain/enum/payment-status.enum.ts";

export interface IAppointmentPaymentDocument extends Document {
  _id: Types.ObjectId;
  appointmentId: Types.ObjectId;
  patientUserId: Types.ObjectId;
  amountMinor: number;
  currency: string;
  status: PaymentStatus;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  lastWebhookEventId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IAppointmentPaymentDocument>({
  appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", required: true, immutable: true },
  patientUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  amountMinor: { type: Number, required: true, min: 1, validate: Number.isSafeInteger, immutable: true },
  currency: { type: String, required: true, enum: ["INR"], immutable: true },
  status: { type: String, required: true, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
  providerOrderId: { type: String, default: null },
  providerPaymentId: { type: String, default: null },
  lastWebhookEventId: { type: String, default: null },
}, { timestamps: true, versionKey: false });

schema.index({ appointmentId:  1 }, { unique: true, name: "uniq_payment_per_appointment" });
schema.index({ providerOrderId: 1 }, { unique: true, partialFilterExpression: { providerOrderId: { $type: "string" } }, name: "uniq_razorpay_order" });
schema.index({ providerPaymentId: 1 }, { unique: true, partialFilterExpression: { providerPaymentId: { $type: "string" } }, name: "uniq_razorpay_payment" });

export const AppointmentPaymentModel = model<IAppointmentPaymentDocument>("AppointmentPayment", schema);
