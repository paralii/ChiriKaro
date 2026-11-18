import { Types } from "mongoose";
import type { IQueueRepository } from "@application/interfaces/repositories/IQueueRepository.ts";
import type { IListPatientQueueUseCase } from "@application/interfaces/use-cases/patient/IListPatientQueueUseCase.ts";
import type { PatientQueueEntryDTO } from "@application/dto/patient/patient-queue.dto.ts";
import { BadRequestError } from "@shared/errors/index.ts";

export class ListPatientQueueUseCase implements IListPatientQueueUseCase {
  constructor(private readonly queue: IQueueRepository) {}

  async execute(patientUserId: string): Promise<PatientQueueEntryDTO[]> {
    if (!Types.ObjectId.isValid(patientUserId)) throw new BadRequestError("Authenticated patient identity is invalid");
    const entries = await this.queue.findForPatient(patientUserId);
    return entries.map((entry) => ({
      tokenNumber: entry.tokenNumber,
      kind: entry.kind,
      clinicName: entry.clinicNameSnapshot,
      doctorName: entry.doctorNameSnapshot,
      localDate: entry.localDate,
      timeZone: entry.timeZone,
      status: entry.status,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));
  }
}
