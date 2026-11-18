import { createHash } from "node:crypto";
import { Types } from "mongoose";
import type { IQueueRepository } from "@application/interfaces/repositories/IQueueRepository.ts";
import type { IQueueTokenSequenceRepository } from "@application/interfaces/repositories/IQueueTokenSequenceRepository.ts";
import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IQueueClinicContext } from "@application/interfaces/services/IQueueClinicContext.ts";
import type { IRegisterWalkInUseCase } from "@application/interfaces/use-cases/clinic/IRegisterWalkInUseCase.ts";
import type { QueueEntryDTO, RegisterWalkInInput } from "@application/dto/clinic/queue.dto.ts";
import type { QueueEntryRecord } from "@domain/entities/booking-workflow.entity.ts";
import { QueueEntryStatus } from "@domain/enum/queue-entry-status.enum.ts";
import { Role } from "@domain/value-objects/Role.ts";
import { UserStatus } from "@domain/enum/user-statues.enum.ts";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "@shared/errors/index.ts";

function toDTO(entry: QueueEntryRecord): QueueEntryDTO {
  return { queueEntryId: entry.id, tokenNumber: entry.tokenNumber, kind: entry.kind, patientName: entry.patientNameSnapshot, doctorName: entry.doctorNameSnapshot, clinicName: entry.clinicNameSnapshot, timeZone: entry.timeZone, localDate: entry.localDate, status: entry.status, createdAt: entry.createdAt };
}

export class RegisterWalkInUseCase implements IRegisterWalkInUseCase {
  constructor(private readonly queue: IQueueRepository, private readonly tokens: IQueueTokenSequenceRepository, private readonly users: IUserRepository, private readonly context: IQueueClinicContext) {}

  async execute(input: RegisterWalkInInput): Promise<QueueEntryDTO> {
    if (![Role.CLINIC_ADMIN, Role.STAFF].includes(input.actorRole as Role)) throw new ForbiddenError("Only clinic admins and staff can register walk-ins");
    if (!Types.ObjectId.isValid(input.actorUserId)) throw new BadRequestError("Authenticated user identity is invalid");
    if (!/^[A-Za-z0-9._:-]{16,128}$/.test(String(input.idempotencyKey ?? ""))) throw new BadRequestError("Idempotency-Key must contain 16 to 128 safe characters");
    const doctorUserId = typeof input.doctorUserId === "string" ? input.doctorUserId : "";
    const email = typeof input.patientEmail === "string" ? input.patientEmail.trim().toLowerCase() : "";
    const guestName = typeof input.guestName === "string" ? input.guestName.trim().replace(/\s+/g, " ") : "";
    if (Boolean(email) === Boolean(guestName)) throw new BadRequestError("Provide either an existing patient's email or a guest name");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestError("Patient email is invalid");
    if (guestName.length > 120) throw new BadRequestError("Guest name is invalid");
    const fingerprint = createHash("sha256").update(JSON.stringify({ doctorUserId, patientEmail: email || null, guestName: guestName || null })).digest("hex");
    const idempotencyKey = input.idempotencyKey as string;
    const existing = await this.queue.findByIdempotencyKey(input.clinicId, idempotencyKey);
    if (existing) {
      if (existing.requestFingerprint !== fingerprint) throw new ConflictError("This Idempotency-Key was already used for another queue registration");
      return toDTO(existing);
    }

    const clinic = await this.context.getOperationalClinic(input.clinicId);
    const doctor = await this.context.getVerifiedDoctor(input.clinicId, doctorUserId);
    let patientUserId: string | null = null;
    let patientName = guestName;
    if (email) {
      const patient = await this.users.findByEmail(email);
      if (!patient || patient.role !== Role.PATIENT || patient.status !== UserStatus.ACTIVE) throw new NotFoundError("Active patient account");
      patientUserId = patient.id;
      patientName = patient.name;
    }
    if (!patientName) throw new BadRequestError("Patient or guest name is required");

    const localDate = this.context.localDate(new Date(), clinic.timeZone);
    const tokenNumber = await this.tokens.nextNumber(input.clinicId, localDate);
    const now = new Date();
    const entry: QueueEntryRecord = {
      id: new Types.ObjectId().toString(), clinicId: input.clinicId, doctorUserId,
      localDate, kind: "WALK_IN", appointmentId: null, patientUserId,
      patientNameSnapshot: patientName, doctorNameSnapshot: `${doctor.firstName} ${doctor.lastName}`,
      clinicNameSnapshot: clinic.name, timeZone: clinic.timeZone,
      tokenNumber, status: QueueEntryStatus.WAITING,
      createdByUserId: input.actorUserId, createdByRole: input.actorRole,
      statusHistory: [{ fromStatus: null, toStatus: QueueEntryStatus.WAITING, actorUserId: input.actorUserId, actorRole: input.actorRole, changedAt: now }],
      idempotencyKey, requestFingerprint: fingerprint, createdAt: now, updatedAt: now,
    };
    try { return toDTO(await this.queue.create(entry)); }
    catch (error) {
      let retry: QueueEntryRecord | null;
      try { retry = await this.queue.findByIdempotencyKey(input.clinicId, idempotencyKey); }
      catch { throw error; }
      if (retry?.requestFingerprint === fingerprint) return toDTO(retry);
      throw error;
    }
  }
}
