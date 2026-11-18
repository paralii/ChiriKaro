import type { QueueEntryStatus } from "@domain/enum/queue-entry-status.enum.ts";

export interface QueueEntryDTO {
  queueEntryId: string;
  tokenNumber: number;
  kind: "WALK_IN" | "APPOINTMENT";
  patientName: string;
  doctorName: string;
  clinicName: string;
  timeZone: string;
  localDate: string;
  status: QueueEntryStatus;
  createdAt: Date;
}

export interface QueueDayDTO {
  localDate: string;
  timeZone: string;
  entries: QueueEntryDTO[];
}

export interface QueueDoctorDTO {
  doctorUserId: string;
  name: string;
}

export interface RegisterWalkInInput {
  clinicId: string;
  actorUserId: string;
  actorRole: string;
  doctorUserId: unknown;
  patientEmail: unknown;
  guestName: unknown;
  idempotencyKey: unknown;
}

export interface CheckInAppointmentInput {
  clinicId: string;
  actorUserId: string;
  actorRole: string;
  appointmentId: string;
}

export interface TransitionQueueEntryInput {
  clinicId: string;
  actorUserId: string;
  actorRole: string;
  queueEntryId: string;
  nextStatus: unknown;
}
