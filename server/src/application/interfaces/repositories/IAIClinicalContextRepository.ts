export interface AIHistoricalConsultation {
  data: { chiefComplaint: string; symptoms: string[]; diagnoses: Array<{ diagnosis: string; affectedTeeth: string[]; severity: string; remarks: string }>; prescriptions: Array<{ medicine: string; dosage: string; frequency: string; duration: string; instructions: string }> };
}
export interface AITreatmentHistory {
  title: string; diagnosis: string; procedures: Array<{ procedure: string; affectedTeeth: string[]; instructions: string }>; status: string;
}
export interface AIFollowUpHistory { reason: string; notes: string; status: string }
export interface IAIClinicalContextRepository {
  consultations(patientUserId: string, clinicId: string, excludeConsultationId: string): Promise<AIHistoricalConsultation[]>;
  treatmentPlans(patientUserId: string, clinicId: string, doctorUserId: string): Promise<AITreatmentHistory[]>;
  followUps(patientUserId: string, clinicId: string, doctorUserId: string): Promise<AIFollowUpHistory[]>;
}
