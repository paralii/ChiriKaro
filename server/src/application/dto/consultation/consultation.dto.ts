import type { ConsultationRecord } from "@domain/entities/consultation.entity.ts";
export type ConsultationDTO = Omit<ConsultationRecord, "attachments"> & { attachments: Array<Omit<ConsultationRecord["attachments"][number], "documentKey">> };
export type ConsultationUpdate = { data: unknown; medicalHistorySnapshot?: unknown };
