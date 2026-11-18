import type { AppointmentStatus } from "@domain/enum/appointment-status.enum.ts";

export interface CreateAppointmentInput {
  patientUserId: string;
  listingId: string;
  date: unknown;
  startsAt: unknown;
  idempotencyKey: unknown;
}

export interface AppointmentDTO {
  appointmentId: string;
  listingId: string;
  clinicName: string;
  doctorName: string;
  localDate: string;
  timeZone: string;
  startsAt: Date;
  endsAt: Date;
  localStartTime: string;
  localEndTime: string;
  feeAmountMinor: number;
  feeCurrency: string;
  status: AppointmentStatus;
  holdExpiresAt: Date;
  holdExpired: boolean;
  changeWindowOpen: boolean;
  createdAt: Date;
  rescheduleCount: number;
  changeHistory: Array<{ type: "CANCELLED" | "RESCHEDULED"; previousLocalDate: string; previousStartsAt: Date; previousEndsAt: Date; previousLocalStartTime: string; previousLocalEndTime: string; changedAt: Date }>;
  cancellationRefundReviewStatus?: "NOT_REQUIRED" | "PENDING_REVIEW";
}

export interface RescheduleAppointmentInput {
  patientUserId: string;
  appointmentId: string;
  listingId: string;
  date: unknown;
  startsAt: unknown;
}
