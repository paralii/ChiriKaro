import { createHash } from "node:crypto";
import { Types } from "mongoose";
import type { IAppointmentRepository } from "@application/interfaces/repositories/IAppointmentRepository.ts";
import type { IQueueRepository } from "@application/interfaces/repositories/IQueueRepository.ts";
import type { IQueueTokenSequenceRepository } from "@application/interfaces/repositories/IQueueTokenSequenceRepository.ts";
import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IQueueClinicContext } from "@application/interfaces/services/IQueueClinicContext.ts";
import type { ICheckInAppointmentUseCase } from "@application/interfaces/use-cases/clinic/ICheckInAppointmentUseCase.ts";
import type { CheckInAppointmentInput, QueueEntryDTO } from "@application/dto/clinic/queue.dto.ts";
import type { QueueEntryRecord } from "@domain/entities/booking-workflow.entity.ts";
import { QueueEntryStatus } from "@domain/enum/queue-entry-status.enum.ts";
import { Role } from "@domain/value-objects/Role.ts";
import { UserStatus } from "@domain/enum/user-statues.enum.ts";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "@shared/errors/index.ts";

function toDTO(entry: QueueEntryRecord): QueueEntryDTO {
  return { queueEntryId: entry.id, tokenNumber: entry.tokenNumber, kind: entry.kind, patientName: entry.patientNameSnapshot, doctorName: entry.doctorNameSnapshot, clinicName: entry.clinicNameSnapshot, timeZone: entry.timeZone, localDate: entry.localDate, status: entry.status, createdAt: entry.createdAt };
}

export class CheckInAppointmentUseCase implements ICheckInAppointmentUseCase {
  constructor(private readonly queue: IQueueRepository, private readonly tokens: IQueueTokenSequenceRepository, private readonly appointments: IAppointmentRepository, private readonly users: IUserRepository, private readonly context: IQueueClinicContext) {}

  async execute(input: CheckInAppointmentInput): Promise<QueueEntryDTO> {
    if (![Role.CLINIC_ADMIN, Role.STAFF].includes(input.actorRole as Role)) throw new ForbiddenError("Only clinic admins and staff can check patients into the queue");
    if (!Types.ObjectId.isValid(input.appointmentId)) throw new BadRequestError("Appointment id is invalid");
    const clinic = await this.context.getOperationalClinic(input.clinicId);
    const appointment = await this.appointments.findConfirmedForQueue(input.appointmentId, input.clinicId);
    if (!appointment) throw new NotFoundError("Confirmed appointment in this clinic");
    const localDate = this.context.localDate(new Date(), clinic.timeZone);
    if (appointment.slot.localDate !== localDate) throw new ConflictError("Only today's confirmed appointments can join today's queue");
    const existing = await this.queue.findByAppointmentId(input.appointmentId);
    if (existing) return toDTO(existing);
    const patient = await this.users.findById(appointment.patientUserId);
    if (!patient || patient.role !== Role.PATIENT || patient.status !== UserStatus.ACTIVE) throw new NotFoundError("Active patient account");
    const tokenNumber = await this.tokens.nextNumber(input.clinicId, localDate);
    const idempotencyKey = `appointment:${input.appointmentId}`;
    const now = new Date();
    const entry: QueueEntryRecord = {
      id: new Types.ObjectId().toString(), clinicId: input.clinicId,
      doctorUserId: appointment.doctorUserId, localDate, kind: "APPOINTMENT",
      appointmentId: input.appointmentId, patientUserId: patient.id,
      patientNameSnapshot: patient.name, doctorNameSnapshot: appointment.doctorNameSnapshot,
      clinicNameSnapshot: clinic.name, timeZone: clinic.timeZone,
      tokenNumber, status: QueueEntryStatus.WAITING,
      createdByUserId: input.actorUserId, createdByRole: input.actorRole,
      statusHistory: [{ fromStatus: null, toStatus: QueueEntryStatus.WAITING, actorUserId: input.actorUserId, actorRole: input.actorRole, changedAt: now }],
      idempotencyKey, requestFingerprint: createHash("sha256").update(input.appointmentId).digest("hex"),
      createdAt: now, updatedAt: now,
    };
    try { return toDTO(await this.queue.create(entry)); }
    catch (error) {
      let retry: QueueEntryRecord | null;
      try { retry = await this.queue.findByAppointmentId(input.appointmentId); }
      catch { throw error; }
      if (retry) return toDTO(retry);
      throw error;
    }
  }
}
