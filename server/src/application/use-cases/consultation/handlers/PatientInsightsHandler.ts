import type { ConsultationRecord } from "@domain/entities/consultation.entity.ts";
import type { IAIProvider } from "@application/interfaces/services/IAIProvider.ts";
import type { IAIAssistanceFeatureHandler } from "@application/interfaces/services/IAIAssistanceFeatureHandler.ts";
import type { PatientInsightsDTO } from "@application/dto/consultation/ai-assistance.dto.ts";
import type { AIClinicalContextService } from "@application/services/ai/AIClinicalContextService.ts";
import { AIPrivacyFilter } from "@application/services/ai/AIPrivacyFilter.ts";
import { AIPromptBuilder } from "@application/services/ai/AIPromptBuilder.ts";
import { AIInputFingerprint } from "@application/services/ai/AIInputFingerprint.ts";
import { parseResponseObject, responseTextList } from "@application/services/ai/ai-response-validation.ts";
import { BadRequestError, RetryableAIProviderError, ValidationError } from "@shared/errors/index.ts";

const instructions = "Task: PATIENT_INSIGHTS. Return JSON only with recordedFacts and interpretations (string arrays) and insufficientInformation (boolean). Separate directly recorded facts from cautious interpretations. Do not claim a pattern when records do not support it; then set insufficientInformation true and interpretations empty.";
export class PatientInsightsHandler implements IAIAssistanceFeatureHandler<PatientInsightsDTO> {
  constructor(private readonly provider: IAIProvider, private readonly context: AIClinicalContextService, private readonly privacy: AIPrivacyFilter, private readonly prompts: AIPromptBuilder, private readonly fingerprints = new AIInputFingerprint()) {}

  private async normalizedInput(consultation: ConsultationRecord) {
    const patientId = consultation.patientUserId;
    if (!patientId) throw new BadRequestError("AI insights require a registered patient account");
    const context = await this.context.historical(patientId, consultation.clinicId, consultation.doctorUserId, consultation.id);
    const source = {
      consultations: context.consultations.slice(0, 30).map((item) => ({ chiefComplaint: this.privacy.cleanText(item.data.chiefComplaint), symptoms: item.data.symptoms.slice(0, 20).map((value) => this.privacy.cleanText(value, 300)), diagnoses: item.data.diagnoses.slice(0, 20).map((diagnosis) => this.privacy.cleanText(diagnosis.diagnosis, 300)) })),
      treatmentHistory: context.treatmentPlans.slice(0, 20).map((plan) => ({ diagnosis: this.privacy.cleanText(plan.diagnosis, 300), procedures: plan.procedures.slice(0, 20).map((item) => this.privacy.cleanText(item.procedure, 200)), status: plan.status })),
      followUps: context.followUps.slice(0, 20).map((followUp) => ({ reason: this.privacy.cleanText(followUp.reason, 300), status: followUp.status })),
    };
    return JSON.parse(this.privacy.redact(JSON.stringify(source), consultation.patientNameSnapshot)) as Record<string, unknown>;
  }

  async fingerprint(consultation: ConsultationRecord): Promise<string> {
    return this.fingerprints.create("patient-insights", await this.normalizedInput(consultation));
  }

  async execute(consultation: ConsultationRecord): Promise<PatientInsightsDTO> {
    const safeSource = await this.normalizedInput(consultation);
    const inputFingerprint = this.fingerprints.create("patient-insights", safeSource);
    const raw = await this.provider.generate(this.prompts.build(instructions, safeSource));
    try {
      const value = parseResponseObject(raw);
      if (typeof value.insufficientInformation !== "boolean") throw new ValidationError("AI response field insufficientInformation is invalid");
      return { recordedFacts: responseTextList(value.recordedFacts, "recordedFacts"), interpretations: responseTextList(value.interpretations, "interpretations"), insufficientInformation: value.insufficientInformation, inputFingerprint };
    } catch (error) { if (error instanceof ValidationError) throw new RetryableAIProviderError("AI provider returned an invalid response"); throw error; }
  }
}
