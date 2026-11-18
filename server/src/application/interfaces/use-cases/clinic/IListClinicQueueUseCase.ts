import type { QueueDayDTO } from "@application/dto/clinic/queue.dto.ts";
export interface ListClinicQueueInput { clinicId: string; actorUserId: string; actorRole: string; requestedDoctorUserId?: string; }
export interface IListClinicQueueUseCase { execute(input: ListClinicQueueInput): Promise<QueueDayDTO>; }
