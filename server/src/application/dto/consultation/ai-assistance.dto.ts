export type AITextList = string[];
export interface AIResultFingerprint { inputFingerprint?: string }
export interface SymptomAnalysisDTO extends AIResultFingerprint {
  summary: string;
  considerations: Array<{ consideration: string; rationale: string }>;
  questions: AITextList;
  warningSigns: AITextList;
}
export interface PatientBriefDTO extends AIResultFingerprint {
  overview: string;
  medicalHistory: AITextList;
  previousDiagnoses: AITextList;
  prescriptions: AITextList;
  treatmentHistory: AITextList;
  followUps: AITextList;
  recordsReviewed: AITextList;
}
export interface PatientInsightsDTO extends AIResultFingerprint {
  recordedFacts: AITextList;
  interpretations: AITextList;
  insufficientInformation: boolean;
}
