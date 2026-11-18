import type { QueueDoctorDTO } from "@application/dto/clinic/queue.dto.ts";
export interface IListQueueDoctorsUseCase { execute(input: { clinicId: string; actorUserId: string; actorRole: string }): Promise<QueueDoctorDTO[]>; }
