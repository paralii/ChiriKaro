import type { ConsultationRecord } from "@domain/entities/consultation.entity.ts";
import type { IAIProvider } from "@application/interfaces/services/IAIProvider.ts";
import type { IAIAssistanceFeatureHandler } from "@application/interfaces/services/IAIAssistanceFeatureHandler.ts";
import type { PatientBriefDTO } from "@application/dto/consultation/ai-assistance.dto.ts";
import type { AIClinicalContextService } from "@application/services/ai/AIClinicalContextService.ts";
import { AIPrivacyFilter } from "@application/services/ai/AIPrivacyFilter.ts";
import { AIPromptBuilder } from "@application/services/ai/AIPromptBuilder.ts";
import { AIInputFingerprint } from "@application/services/ai/AIInputFingerprint.ts";
import { parseResponseObject, responseText, responseTextList } from "@application/services/ai/ai-response-validation.ts";
import { BadRequestError, RetryableAIProviderError, ValidationError } from "@shared/errors/index.ts";

const instructions = "Task: PATIENT_BRIEF. Return JSON only with overview (string), medicalHistory, previousDiagnoses, prescriptions, treatmentHistory, followUps, recordsReviewed (string arrays). Summarize recorded facts only; do not infer missing facts.";
export class PatientBriefHandler implements IAIAssistanceFeatureHandler<PatientBriefDTO> {
  constructor(private readonly provider: IAIProvider, private readonly context: AIClinicalContextService, private readonly privacy: AIPrivacyFilter, private readonly prompts: AIPromptBuilder, private readonly fingerprints = new AIInputFingerprint()) {}

  private async normalizedInput(consultation: ConsultationRecord) {
    const patientId = consultation.patientUserId;
    if (!patientId) throw new BadRequestError("AI patient brief requires a registered patient account");
    const [context, medicalHistory] = await Promise.all([
      this.context.historical(patientId, consultation.clinicId, consultation.doctorUserId, consultation.id),
      this.context.medicalHistory(patientId, consultation.medicalHistorySnapshot),
    ]);
    const source = {
      medicalHistory: {
        conditions: medicalHistory.existingConditions.slice(0, 20).map((value) => this.privacy.cleanText(value, 300)), allergies: medicalHistory.allergies.slice(0, 20).map((value) => this.privacy.cleanText(value, 300)),
        medications: medicalHistory.medications.slice(0, 20).map((value) => this.privacy.cleanText(value, 300)), surgeries: medicalHistory.previousSurgeries.slice(0, 10).map((value) => this.privacy.cleanText(value, 300)),
        dentalHistory: this.privacy.cleanText(medicalHistory.dentalHistory),
      },
      consultations: context.consultations.map((item) => ({
        chiefComplaint: this.privacy.cleanText(item.data.chiefComplaint), symptoms: item.data.symptoms.slice(0, 20).map((value) => this.privacy.cleanText(value, 300)),
        diagnoses: item.data.diagnoses.slice(0, 20).map((d) => ({ diagnosis: this.privacy.cleanText(d.diagnosis, 300), severity: this.privacy.cleanText(d.severity, 100) })),
        prescriptions: item.data.prescriptions.slice(0, 20).map((p) => `${this.privacy.cleanText(p.medicine, 100)}; ${this.privacy.cleanText(p.dosage, 100)}; ${this.privacy.cleanText(p.frequency, 100)}; ${this.privacy.cleanText(p.duration, 100)}`),
      })),
      plans: context.treatmentPlans.slice(0, 20).map((p) => ({ title: this.privacy.cleanText(p.title, 200), diagnosis: this.privacy.cleanText(p.diagnosis, 300), procedures: p.procedures.slice(0, 20).map((item) => this.privacy.cleanText(item.procedure, 200)), status: p.status })),
      followUps: context.followUps.slice(0, 20).map((f) => ({ reason: this.privacy.cleanText(f.reason, 300), status: f.status })),
    };
    return JSON.parse(this.privacy.redact(JSON.stringify(source), consultation.patientNameSnapshot)) as Record<string, unknown>;
  }

  async fingerprint(consultation: ConsultationRecord): Promise<string> {
    return this.fingerprints.create("patient-brief", await this.normalizedInput(consultation));
  }

  async execute(consultation: ConsultationRecord): Promise<PatientBriefDTO> {
    const safeSource = await this.normalizedInput(consultation);
    const inputFingerprint = this.fingerprints.create("patient-brief", safeSource);
    const raw = await this.provider.generate(this.prompts.build(instructions, safeSource));
    try {
      const value = parseResponseObject(raw);
      return {
        overview: responseText(value.overview, "overview"), medicalHistory: responseTextList(value.medicalHistory, "medicalHistory"),
        previousDiagnoses: responseTextList(value.previousDiagnoses, "previousDiagnoses"), prescriptions: responseTextList(value.prescriptions, "prescriptions"),
        treatmentHistory: responseTextList(value.treatmentHistory, "treatmentHistory"), followUps: responseTextList(value.followUps, "followUps"),
        recordsReviewed: responseTextList(value.recordsReviewed, "recordsReviewed"), inputFingerprint,
      };
    } catch (error) { if (error instanceof ValidationError) throw new RetryableAIProviderError("AI provider returned an invalid response"); throw error; }
  }
}
