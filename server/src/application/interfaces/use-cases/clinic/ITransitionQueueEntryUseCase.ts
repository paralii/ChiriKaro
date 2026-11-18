import type { QueueEntryDTO, TransitionQueueEntryInput } from "@application/dto/clinic/queue.dto.ts";
export interface ITransitionQueueEntryUseCase { execute(input: TransitionQueueEntryInput): Promise<QueueEntryDTO>; }
