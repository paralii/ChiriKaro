import { Types } from "mongoose";
import type { IQueueRepository } from "@application/interfaces/repositories/IQueueRepository.ts";
import type { IQueueClinicContext } from "@application/interfaces/services/IQueueClinicContext.ts";
import type { ITransitionQueueEntryUseCase } from "@application/interfaces/use-cases/clinic/ITransitionQueueEntryUseCase.ts";
import type { QueueEntryDTO, TransitionQueueEntryInput } from "@application/dto/clinic/queue.dto.ts";
import type { QueueEntryRecord } from "@domain/entities/booking-workflow.entity.ts";
import { QueueEntryStatus } from "@domain/enum/queue-entry-status.enum.ts";
import { canTransitionQueueEntry } from "@domain/policies/booking-lifecycle.policy.ts";
import { Role } from "@domain/value-objects/Role.ts";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "@shared/errors/index.ts";

const DOCTOR_TRANSITIONS = new Set<QueueEntryStatus>([
  QueueEntryStatus.SKIPPED,
  QueueEntryStatus.WAITING,
  QueueEntryStatus.NO_SHOW,
]);
const STAFF_TRANSITIONS = new Set<QueueEntryStatus>([QueueEntryStatus.CANCELLED, QueueEntryStatus.NO_SHOW]);

function toDTO(entry: QueueEntryRecord): QueueEntryDTO {
  return { queueEntryId: entry.id, tokenNumber: entry.tokenNumber, kind: entry.kind, patientName: entry.patientNameSnapshot, doctorName: entry.doctorNameSnapshot, clinicName: entry.clinicNameSnapshot, timeZone: entry.timeZone, localDate: entry.localDate, status: entry.status, createdAt: entry.createdAt };
}

export class TransitionQueueEntryUseCase implements ITransitionQueueEntryUseCase {
  constructor(private readonly queue: IQueueRepository, private readonly context: IQueueClinicContext) {}

  async execute(input: TransitionQueueEntryInput): Promise<QueueEntryDTO> {
    const role = input.actorRole as Role;
    if (![Role.CLINIC_ADMIN, Role.STAFF, Role.DOCTOR].includes(role)) throw new ForbiddenError("Queue controls are not available to this role");
    if (!Types.ObjectId.isValid(input.actorUserId) || !Types.ObjectId.isValid(input.queueEntryId)) throw new BadRequestError("Queue entry or authenticated user id is invalid");
    if (!Object.values(QueueEntryStatus).includes(input.nextStatus as QueueEntryStatus)) throw new BadRequestError("Queue status is invalid");
    const nextStatus = input.nextStatus as QueueEntryStatus;
    if (nextStatus === QueueEntryStatus.COMPLETED) throw new ForbiddenError("Queue entries are completed only when a doctor finalizes the consultation");
    if (nextStatus === QueueEntryStatus.IN_CONSULTATION) throw new ForbiddenError("Queue entries enter consultation through the consultation workflow");
    const clinic = await this.context.getOperationalClinic(input.clinicId);
    const localDate = this.context.localDate(new Date(), clinic.timeZone);
    const current = await this.queue.findByIdInClinic(input.queueEntryId, input.clinicId, localDate);
    if (!current) throw new NotFoundError("Queue entry for today's clinic queue");

    if (role === Role.DOCTOR) {
      await this.context.getVerifiedDoctor(input.clinicId, input.actorUserId);
      if (current.doctorUserId !== input.actorUserId) throw new ForbiddenError("Doctors can only control their own queue");
      if (!DOCTOR_TRANSITIONS.has(nextStatus)) throw new ForbiddenError("Doctors cannot perform this queue action");
    } else if (role === Role.STAFF && !STAFF_TRANSITIONS.has(nextStatus)) {
      throw new ForbiddenError("Staff can only cancel a queue entry or mark it no-show");
    }

    if (current.status === nextStatus) return toDTO(current); // Safe retry after a successful status write.
    if (!canTransitionQueueEntry(current.status, nextStatus)) throw new ConflictError(`Queue entry cannot move from ${current.status} to ${nextStatus}`);
    const updated = await this.queue.transitionStatus({
      queueEntryId: current.id, clinicId: input.clinicId, localDate,
      expectedStatus: current.status, nextStatus, actorUserId: input.actorUserId,
      actorRole: input.actorRole, changedAt: new Date(),
    });
    if (updated) return toDTO(updated);

    const latest = await this.queue.findByIdInClinic(input.queueEntryId, input.clinicId, localDate);
    if (latest?.status === nextStatus) return toDTO(latest);
    throw new ConflictError("Queue status changed concurrently. Refresh the queue and retry.");
  }
}
