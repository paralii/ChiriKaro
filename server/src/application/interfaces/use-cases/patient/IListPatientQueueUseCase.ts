import type { PatientQueueEntryDTO } from "@application/dto/patient/patient-queue.dto.ts";
export interface IListPatientQueueUseCase { execute(patientUserId: string): Promise<PatientQueueEntryDTO[]>; }
