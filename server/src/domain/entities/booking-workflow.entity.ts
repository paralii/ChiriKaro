import { AppointmentStatus } from "@domain/enum/appointment-status.enum.ts";
import { PaymentStatus } from "@domain/enum/payment-status.enum.ts";
import { QueueEntryStatus } from "@domain/enum/queue-entry-status.enum.ts";

/** A dated, clinic-local candidate interval. It is not a booking or reservation. */
export interface BookingSlot {
  clinicId: string;
  doctorUserId: string;
  localDate: string;
  timezone: string;
  startsAt: Date;
  endsAt: Date;
  localStartTime: string;
  localEndTime: string;
}

/** Appointment captures patient, clinic, doctor, and the quoted fee historically. */
export interface AppointmentRecord {
  id: string;
  patientUserId: string;
  clinicId: string;
  doctorUserId: string;
  clinicNameSnapshot: string;
  doctorNameSnapshot: string;
  slot: BookingSlot;
  feeSnapshot: { amountMinor: number; currency: string };
  status: AppointmentStatus;
  idempotencyKey: string;
  requestFingerprint: string;
  holdExpiresAt: Date;
  rescheduleCount: number;
  changeHistory: AppointmentChangeRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentChangeRecord {
  type: "CANCELLED" | "RESCHEDULED";
  previousLocalDate: string;
  previousStartsAt: Date;
  previousEndsAt: Date;
  previousLocalStartTime: string;
  previousLocalEndTime: string;
  changedAt: Date;
}

/** Payment is attached to one appointment; provider references are reconciliation data. */
export interface AppointmentPaymentRecord {
  id: string;
  appointmentId: string;
  amountMinor: number;
  currency: string;
  status: PaymentStatus;
  provider: "RAZORPAY";
  providerOrderId: string | null;
  providerPaymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Queue entry is operational state, distinct from appointment and payment state. */
export interface QueueEntryRecord {
  id: string;
  clinicId: string;
  doctorUserId: string;
  localDate: string;
  appointmentId: string | null;
  patientUserId: string | null;
  tokenNumber: number;
  status: QueueEntryStatus;
  createdAt: Date;
  updatedAt: Date;
}
