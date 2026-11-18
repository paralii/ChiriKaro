import type { QueueEntryRecord } from "@domain/entities/booking-workflow.entity.ts";

export interface IQueueRepository {
  findByIdempotencyKey(clinicId: string, idempotencyKey: string): Promise<QueueEntryRecord | null>;
  findByAppointmentId(appointmentId: string): Promise<QueueEntryRecord | null>;
  create(entry: QueueEntryRecord): Promise<QueueEntryRecord>;
  listForClinic(clinicId: string, localDate: string, doctorUserId?: string): Promise<QueueEntryRecord[]>;
}
