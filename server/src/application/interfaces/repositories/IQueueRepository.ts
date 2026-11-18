import type { QueueEntryRecord } from "@domain/entities/booking-workflow.entity.ts";
import type { QueueEntryStatus } from "@domain/enum/queue-entry-status.enum.ts";

export interface IQueueRepository {
  findByIdempotencyKey(clinicId: string, idempotencyKey: string): Promise<QueueEntryRecord | null>;
  findByAppointmentId(appointmentId: string): Promise<QueueEntryRecord | null>;
  create(entry: QueueEntryRecord): Promise<QueueEntryRecord>;
  listForClinic(clinicId: string, localDate: string, doctorUserId?: string): Promise<QueueEntryRecord[]>;
  findForPatient(patientUserId: string): Promise<QueueEntryRecord[]>;
  findByIdInClinic(queueEntryId: string, clinicId: string, localDate: string): Promise<QueueEntryRecord | null>;
  transitionStatus(input: { queueEntryId: string; clinicId: string; localDate: string; expectedStatus: QueueEntryStatus; nextStatus: QueueEntryStatus; actorUserId: string; actorRole: string; changedAt: Date }): Promise<QueueEntryRecord | null>;
}
