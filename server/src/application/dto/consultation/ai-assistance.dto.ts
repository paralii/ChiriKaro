export type AITextList = string[];
export interface SymptomAnalysisDTO {
  summary: string;
  considerations: Array<{ consideration: string; rationale: string }>;
  questions: AITextList;
  warningSigns: AITextList;
}
export interface PatientBriefDTO {
  overview: string;
  medicalHistory: AITextList;
  previousDiagnoses: AITextList;
  prescriptions: AITextList;
  treatmentHistory: AITextList;
  followUps: AITextList;
  recordsReviewed: AITextList;
}
export interface PatientInsightsDTO {
  recordedFacts: AITextList;
  interpretations: AITextList;
  insufficientInformation: boolean;
}
