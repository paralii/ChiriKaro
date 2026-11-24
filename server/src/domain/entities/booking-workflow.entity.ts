import { AppointmentStatus } from "@domain/enum/appointment-status.enum.ts";
import { PaymentStatus } from "@domain/enum/payment-status.enum.ts";
import { QueueEntryStatus } from "@domain/enum/queue-entry-status.enum.ts";

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

export interface QueueEntryRecord {
  id: string;
  clinicId: string;
  doctorUserId: string;
  localDate: string;
  kind: "WALK_IN" | "APPOINTMENT";
  appointmentId: string | null;
  patientUserId: string | null;
  patientNameSnapshot: string;
  doctorNameSnapshot: string;
  clinicNameSnapshot: string;
  timeZone: string;
  tokenNumber: number;
  status: QueueEntryStatus;
  createdByUserId: string;
  createdByRole: string;
  statusHistory: Array<{ fromStatus: QueueEntryStatus | null; toStatus: QueueEntryStatus; actorUserId: string; actorRole: string; changedAt: Date }>;
  idempotencyKey: string;
  requestFingerprint: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientMedicalHistoryRecord {
  patientUserId: string;
  history: import("@domain/entities/consultation.entity.ts").MedicalHistory;
  updatedBy: string | null;
  updatedAt: Date | null;
}
