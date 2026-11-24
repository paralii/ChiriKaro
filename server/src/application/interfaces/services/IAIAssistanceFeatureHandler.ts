import type { ConsultationRecord } from "@domain/entities/consultation.entity.ts";
import type { PatientBriefDTO, PatientInsightsDTO, SymptomAnalysisDTO } from "@application/dto/consultation/ai-assistance.dto.ts";

export interface IAIAssistanceFeatureHandler<TResult> {
  execute(consultation: ConsultationRecord, input?: unknown): Promise<TResult>;
  fingerprint(consultation: ConsultationRecord, input?: unknown): Promise<string>;
}

export interface AIAssistanceFeatureHandlers {
  symptomAnalysis: IAIAssistanceFeatureHandler<SymptomAnalysisDTO>;
  patientBrief: IAIAssistanceFeatureHandler<PatientBriefDTO>;
  insights: IAIAssistanceFeatureHandler<PatientInsightsDTO>;
}
