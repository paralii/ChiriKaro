import type { ConsultationRecord } from "@domain/entities/consultation.entity.ts";
import type { IAIProvider } from "@application/interfaces/services/IAIProvider.ts";
import type { IAIAssistanceFeatureHandler } from "@application/interfaces/services/IAIAssistanceFeatureHandler.ts";
import type { PatientInsightsDTO } from "@application/dto/consultation/ai-assistance.dto.ts";
import type { AIClinicalContextService } from "@application/services/ai/AIClinicalContextService.ts";
import { AIPrivacyFilter } from "@application/services/ai/AIPrivacyFilter.ts";
import { AIPromptBuilder } from "@application/services/ai/AIPromptBuilder.ts";
import { parseResponseObject, responseTextList } from "@application/services/ai/ai-response-validation.ts";
import { BadRequestError, ValidationError } from "@shared/errors/index.ts";

const instructions = "Task: PATIENT_INSIGHTS. Return JSON only with recordedFacts and interpretations (string arrays) and insufficientInformation (boolean). Separate directly recorded facts from cautious interpretations. Do not claim a pattern when records do not support it; then set insufficientInformation true and interpretations empty.";
export class PatientInsightsHandler implements IAIAssistanceFeatureHandler<PatientInsightsDTO> {
  constructor(private readonly provider: IAIProvider, private readonly context: AIClinicalContextService, private readonly privacy: AIPrivacyFilter, private readonly prompts: AIPromptBuilder) {}

  async execute(consultation: ConsultationRecord): Promise<PatientInsightsDTO> {
    const patientId = consultation.patientUserId;
    if (!patientId) throw new BadRequestError("AI insights require a registered patient account");
    const context = await this.context.historical(patientId, consultation.clinicId, consultation.doctorUserId, consultation.id);
    const source = {
      consultations: context.consultations.map((item) => ({ chiefComplaint: this.privacy.cleanText(item.data.chiefComplaint), symptoms: item.data.symptoms.map((value) => this.privacy.cleanText(value)), diagnoses: item.data.diagnoses.map((diagnosis) => this.privacy.cleanText(diagnosis.diagnosis)) })),
      treatmentHistory: context.treatmentPlans.map((plan) => ({ diagnosis: this.privacy.cleanText(plan.diagnosis), procedures: plan.procedures.map((item) => this.privacy.cleanText(item.procedure)), status: plan.status })),
      followUps: context.followUps.map((followUp) => ({ reason: this.privacy.cleanText(followUp.reason), status: followUp.status })),
    };
    const safeSource = this.privacy.redact(JSON.stringify(source), consultation.patientNameSnapshot);
    const raw = await this.provider.generate(this.prompts.build(instructions, safeSource));
    const value = parseResponseObject(raw);
    if (typeof value.insufficientInformation !== "boolean") throw new ValidationError("AI response field insufficientInformation is invalid");
    return { recordedFacts: responseTextList(value.recordedFacts, "recordedFacts"), interpretations: responseTextList(value.interpretations, "interpretations"), insufficientInformation: value.insufficientInformation };
  }
}
