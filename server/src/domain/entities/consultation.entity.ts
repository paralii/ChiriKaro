import type { QueueEntryStatus } from "@domain/enum/queue-entry-status.enum.ts";

export type MedicalHistory = {
  existingConditions: string[];
  allergies: string[];
  medications: string[];
  previousSurgeries: string[];
  dentalHistory: string;
  remarks: string;
};

export type ConsultationData = {
  chiefComplaint: string;
  symptoms: string[];
  painLevel: number | null;
  examinationFindings: string;
  clinicalNotes: string;
  dentalChart: Array<{ toothNumber: string; condition: string; affectedSurface: string; observations: string }>;
  diagnoses: Array<{ diagnosis: string; affectedTeeth: string[]; severity: string; remarks: string }>;
  treatmentPlan: Array<{ procedure: string; affectedTeeth: string[]; estimatedCost: number | null; numberOfSessions: number | null; instructions: string }>;
  prescriptions: Array<{ medicine: string; dosage: string; frequency: string; duration: string; instructions: string }>;
};

export type ConsultationAttachment = { id: string; category: string; fileName: string; contentType: string; documentKey: string; uploadedBy: string; uploadedAt: Date };

export interface ConsultationRecord {
  id: string;
  queueEntryId: string;
  clinicId: string;
  doctorUserId: string;
  patientUserId: string | null;
  patientNameSnapshot: string;
  appointmentId: string | null;
  visitDetails: { localDate: string; localStartTime: string | null; localEndTime: string | null; tokenNumber: number; clinicName: string };
  status: "IN_PROGRESS" | "COMPLETED";
  medicalHistorySnapshot: MedicalHistory;
  data: ConsultationData;
  attachments: ConsultationAttachment[];
  startedAt: Date;
  startedBy: string;
  completedAt: Date | null;
  completedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type QueueTransitionRecord = {
  id: string;
  clinicId: string;
  localDate: string;
  expectedStatus: QueueEntryStatus;
  nextStatus: QueueEntryStatus;
  actorUserId: string;
  actorRole: string;
  changedAt: Date;
};
