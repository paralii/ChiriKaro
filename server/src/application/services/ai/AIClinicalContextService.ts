import type { MedicalHistory } from "@domain/entities/consultation.entity.ts";
import type { AIHistoricalConsultation, AITreatmentHistory, AIFollowUpHistory, IAIClinicalContextRepository } from "@application/interfaces/repositories/IAIClinicalContextRepository.ts";
import type { IAIPatientHistoryRepository } from "@application/interfaces/repositories/IAIPatientHistoryRepository.ts";

export interface AIClinicalContext {
  consultations: AIHistoricalConsultation[];
  treatmentPlans: AITreatmentHistory[];
  followUps: AIFollowUpHistory[];
}

export class AIClinicalContextService {
  constructor(private readonly clinical: IAIClinicalContextRepository, private readonly patientHistory: IAIPatientHistoryRepository) {}

  async historical(patientUserId: string, clinicId: string, doctorUserId: string, currentConsultationId: string): Promise<AIClinicalContext> {
    const [consultations, treatmentPlans, followUps] = await Promise.all([
      this.clinical.consultations(patientUserId, clinicId, currentConsultationId),
      this.clinical.treatmentPlans(patientUserId, clinicId, doctorUserId),
      this.clinical.followUps(patientUserId, clinicId, doctorUserId),
    ]);
    return { consultations, treatmentPlans, followUps };
  }

  async medicalHistory(patientUserId: string, fallback: MedicalHistory): Promise<MedicalHistory> {
    return (await this.patientHistory.getMedicalHistory(patientUserId))?.history ?? fallback;
  }
}
