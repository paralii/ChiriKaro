import type { QueueEntryRecord } from "@domain/entities/booking-workflow.entity.ts";
import type { IQueueRepository } from "@application/interfaces/repositories/IQueueRepository.ts";
import type { IQueueClinicContext } from "@application/interfaces/services/IQueueClinicContext.ts";
import type { IListClinicQueueUseCase, ListClinicQueueInput } from "@application/interfaces/use-cases/clinic/IListClinicQueueUseCase.ts";
import type { QueueDayDTO, QueueEntryDTO } from "@application/dto/clinic/queue.dto.ts";
import { Role } from "@domain/value-objects/Role.ts";
import { ForbiddenError } from "@shared/errors/index.ts";

function toDTO(entry: QueueEntryRecord): QueueEntryDTO {
  return { queueEntryId: entry.id, tokenNumber: entry.tokenNumber, kind: entry.kind, patientName: entry.patientNameSnapshot, doctorName: entry.doctorNameSnapshot, clinicName: entry.clinicNameSnapshot, timeZone: entry.timeZone, localDate: entry.localDate, status: entry.status, createdAt: entry.createdAt };
}

export class ListClinicQueueUseCase implements IListClinicQueueUseCase {
  constructor(private readonly queue: IQueueRepository, private readonly context: IQueueClinicContext) {}

  async execute(input: ListClinicQueueInput): Promise<QueueDayDTO> {
    const role = input.actorRole as Role;
    if (![Role.CLINIC_ADMIN, Role.STAFF, Role.DOCTOR].includes(role)) throw new ForbiddenError("Queue access is not allowed");
    const clinic = await this.context.getOperationalClinic(input.clinicId);
    let doctorUserId = input.requestedDoctorUserId;
    if (role === Role.DOCTOR) {
      if (doctorUserId && doctorUserId !== input.actorUserId) throw new ForbiddenError("Doctors can only view their own clinic queue");
      doctorUserId = input.actorUserId;
    }
    if (doctorUserId) await this.context.getVerifiedDoctor(input.clinicId, doctorUserId);
    const localDate = this.context.localDate(new Date(), clinic.timeZone);
    const entries = await this.queue.listForClinic(input.clinicId, localDate, doctorUserId);
    return { localDate, timeZone: clinic.timeZone, entries: entries.map(toDTO) };
  }
}
