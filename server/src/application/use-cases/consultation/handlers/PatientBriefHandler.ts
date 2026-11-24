import type { ConsultationRecord } from "@domain/entities/consultation.entity.ts";
import type { IAIProvider } from "@application/interfaces/services/IAIProvider.ts";
import type { IAIAssistanceFeatureHandler } from "@application/interfaces/services/IAIAssistanceFeatureHandler.ts";
import type { PatientBriefDTO } from "@application/dto/consultation/ai-assistance.dto.ts";
import type { AIClinicalContextService } from "@application/services/ai/AIClinicalContextService.ts";
import { AIPrivacyFilter } from "@application/services/ai/AIPrivacyFilter.ts";
import { AIPromptBuilder } from "@application/services/ai/AIPromptBuilder.ts";
import { parseResponseObject, responseText, responseTextList } from "@application/services/ai/ai-response-validation.ts";
import { BadRequestError } from "@shared/errors/index.ts";

const instructions = "Task: PATIENT_BRIEF. Return JSON only with overview (string), medicalHistory, previousDiagnoses, prescriptions, treatmentHistory, followUps, recordsReviewed (string arrays). Summarize recorded facts only; do not infer missing facts.";
export class PatientBriefHandler implements IAIAssistanceFeatureHandler<PatientBriefDTO> {
  constructor(private readonly provider: IAIProvider, private readonly context: AIClinicalContextService, private readonly privacy: AIPrivacyFilter, private readonly prompts: AIPromptBuilder) {}

  async execute(consultation: ConsultationRecord): Promise<PatientBriefDTO> {
    const patientId = consultation.patientUserId;
    if (!patientId) throw new BadRequestError("AI patient brief requires a registered patient account");
    const [context, medicalHistory] = await Promise.all([
      this.context.historical(patientId, consultation.clinicId, consultation.doctorUserId, consultation.id),
      this.context.medicalHistory(patientId, consultation.medicalHistorySnapshot),
    ]);
    const source = {
      medicalHistory: {
        conditions: medicalHistory.existingConditions.map((value) => this.privacy.cleanText(value)), allergies: medicalHistory.allergies.map((value) => this.privacy.cleanText(value)),
        medications: medicalHistory.medications.map((value) => this.privacy.cleanText(value)), surgeries: medicalHistory.previousSurgeries.map((value) => this.privacy.cleanText(value)),
        dentalHistory: this.privacy.cleanText(medicalHistory.dentalHistory), remarks: this.privacy.cleanText(medicalHistory.remarks),
      },
      consultations: context.consultations.map((item) => ({
        chiefComplaint: this.privacy.cleanText(item.data.chiefComplaint), symptoms: item.data.symptoms.map((value) => this.privacy.cleanText(value)),
        diagnoses: item.data.diagnoses.map((d) => ({ diagnosis: this.privacy.cleanText(d.diagnosis), severity: this.privacy.cleanText(d.severity), remarks: this.privacy.cleanText(d.remarks) })),
        prescriptions: item.data.prescriptions.map((p) => `${this.privacy.cleanText(p.medicine)}; ${this.privacy.cleanText(p.dosage)}; ${this.privacy.cleanText(p.frequency)}; ${this.privacy.cleanText(p.duration)}`),
      })),
      plans: context.treatmentPlans.map((p) => ({ title: this.privacy.cleanText(p.title), diagnosis: this.privacy.cleanText(p.diagnosis), procedures: p.procedures.map((item) => this.privacy.cleanText(item.procedure)), status: p.status })),
      followUps: context.followUps.map((f) => ({ reason: this.privacy.cleanText(f.reason), notes: this.privacy.cleanText(f.notes), status: f.status })),
    };
    const safeSource = this.privacy.redact(JSON.stringify(source), consultation.patientNameSnapshot);
    const raw = await this.provider.generate(this.prompts.build(instructions, safeSource));
    const value = parseResponseObject(raw);
    return {
      overview: responseText(value.overview, "overview"), medicalHistory: responseTextList(value.medicalHistory, "medicalHistory"),
      previousDiagnoses: responseTextList(value.previousDiagnoses, "previousDiagnoses"), prescriptions: responseTextList(value.prescriptions, "prescriptions"),
      treatmentHistory: responseTextList(value.treatmentHistory, "treatmentHistory"), followUps: responseTextList(value.followUps, "followUps"),
      recordsReviewed: responseTextList(value.recordsReviewed, "recordsReviewed"),
    };
  }
}
