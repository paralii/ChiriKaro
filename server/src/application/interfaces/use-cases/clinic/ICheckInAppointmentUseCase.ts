import type { CheckInAppointmentInput, QueueEntryDTO } from "@application/dto/clinic/queue.dto.ts";
export interface ICheckInAppointmentUseCase { execute(input: CheckInAppointmentInput): Promise<QueueEntryDTO>; }
