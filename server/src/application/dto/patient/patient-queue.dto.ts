import type { QueueEntryStatus } from "@domain/enum/queue-entry-status.enum.ts";

export interface PatientQueueEntryDTO {
  tokenNumber: number;
  kind: "WALK_IN" | "APPOINTMENT";
  clinicName: string;
  doctorName: string;
  localDate: string;
  timeZone: string;
  status: QueueEntryStatus;
  createdAt: Date;
  updatedAt: Date;
}
