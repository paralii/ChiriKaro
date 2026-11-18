import type { QueueEntryDTO, RegisterWalkInInput } from "@application/dto/clinic/queue.dto.ts";
export interface IRegisterWalkInUseCase { execute(input: RegisterWalkInInput): Promise<QueueEntryDTO>; }
