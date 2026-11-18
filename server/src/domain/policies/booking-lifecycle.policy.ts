import { AppointmentStatus } from "@domain/enum/appointment-status.enum.ts";
import { PaymentStatus } from "@domain/enum/payment-status.enum.ts";
import { QueueEntryStatus } from "@domain/enum/queue-entry-status.enum.ts";

const APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  [AppointmentStatus.PENDING_PAYMENT]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
  [AppointmentStatus.CONFIRMED]: [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.COMPLETED]: [],
};

const PAYMENT_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [PaymentStatus.SUCCEEDED, PaymentStatus.FAILED],
  [PaymentStatus.SUCCEEDED]: [PaymentStatus.REFUNDED],
  [PaymentStatus.FAILED]: [PaymentStatus.PENDING],
  [PaymentStatus.REFUNDED]: [],
  // A late provider capture can arrive after a local order was cancelled; it is recorded and flagged for manual review.
  [PaymentStatus.CANCELLED]: [PaymentStatus.SUCCEEDED],
};

const QUEUE_TRANSITIONS: Record<QueueEntryStatus, readonly QueueEntryStatus[]> = {
  [QueueEntryStatus.WAITING]: [QueueEntryStatus.IN_CONSULTATION, QueueEntryStatus.SKIPPED, QueueEntryStatus.CANCELLED, QueueEntryStatus.NO_SHOW],
  [QueueEntryStatus.IN_CONSULTATION]: [QueueEntryStatus.COMPLETED],
  [QueueEntryStatus.SKIPPED]: [QueueEntryStatus.WAITING, QueueEntryStatus.CANCELLED, QueueEntryStatus.NO_SHOW],
  [QueueEntryStatus.COMPLETED]: [],
  [QueueEntryStatus.CANCELLED]: [],
  [QueueEntryStatus.NO_SHOW]: [],
};

export function canTransitionAppointment(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return APPOINTMENT_TRANSITIONS[from].includes(to);
}

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return PAYMENT_TRANSITIONS[from].includes(to);
}

export function canTransitionQueueEntry(from: QueueEntryStatus, to: QueueEntryStatus): boolean {
  return QUEUE_TRANSITIONS[from].includes(to);
}
