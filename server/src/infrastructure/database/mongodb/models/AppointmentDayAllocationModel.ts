import { model, Schema, Types } from "mongoose";

export interface IAppointmentAllocation {
  appointmentId: Types.ObjectId;
  patientUserId: Types.ObjectId;
  startsAt: Date;
  endsAt: Date;
  holdExpiresAt: Date;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "RELEASED";
}

export interface IAppointmentDayAllocation {
  _id: string;
  reservations: IAppointmentAllocation[];
  createdAt: Date;
  updatedAt: Date;
}

const reservationSchema = new Schema<IAppointmentAllocation>({
  appointmentId: { type: Schema.Types.ObjectId, required: true },
  patientUserId: { type: Schema.Types.ObjectId, required: true },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  holdExpiresAt: { type: Date, required: true },
  status: { type: String, required: true, enum: ["PENDING_PAYMENT", "CONFIRMED", "RELEASED"] },
}, { _id: false });

const allocationSchema = new Schema<IAppointmentDayAllocation>({
  _id: { type: String, required: true },
  reservations: { type: [reservationSchema], default: [] },
}, { timestamps: true, versionKey: false });

export const AppointmentDayAllocationModel = model<IAppointmentDayAllocation>("AppointmentDayAllocation", allocationSchema);
