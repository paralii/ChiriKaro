import type { ConsultationRecord } from "@domain/entities/consultation.entity.ts";
import type { IAIProvider } from "@application/interfaces/services/IAIProvider.ts";
import type { IAIAssistanceFeatureHandler } from "@application/interfaces/services/IAIAssistanceFeatureHandler.ts";
import type { SymptomAnalysisDTO } from "@application/dto/consultation/ai-assistance.dto.ts";
import { AIInputValidator } from "@application/services/ai/AIInputValidator.ts";
import { AIPrivacyFilter } from "@application/services/ai/AIPrivacyFilter.ts";
import { AIPromptBuilder } from "@application/services/ai/AIPromptBuilder.ts";
import { parseResponseObject, responseText, responseTextList } from "@application/services/ai/ai-response-validation.ts";
import { BadRequestError, ValidationError } from "@shared/errors/index.ts";

const instructions = "Task: SYMPTOM_ANALYSIS. Return JSON only with summary (string), considerations (array of {consideration,rationale}), questions (string array), warningSigns (string array). Give possible clinical considerations only, never a diagnosis or treatment order. Only flag warning signs supported by the provided facts; otherwise return an empty array.";

export class SymptomAnalysisHandler implements IAIAssistanceFeatureHandler<SymptomAnalysisDTO> {
  constructor(private readonly provider: IAIProvider, private readonly validator: AIInputValidator, private readonly privacy: AIPrivacyFilter, private readonly prompts: AIPromptBuilder) {}

  async execute(consultation: ConsultationRecord, input?: unknown): Promise<SymptomAnalysisDTO> {
    if (consultation.status !== "IN_PROGRESS") throw new BadRequestError("AI assistance is available only during an active consultation");
    const data = input === undefined ? {
      chiefComplaint: consultation.data.chiefComplaint, symptoms: consultation.data.symptoms, painLevel: consultation.data.painLevel,
      examinationFindings: consultation.data.examinationFindings, clinicalNotes: consultation.data.clinicalNotes, medicalHistory: consultation.medicalHistorySnapshot,
    } : input;
    const validated = this.validator.validateSymptomInput(data, consultation.medicalHistorySnapshot);
    const source = {
      chiefComplaint: validated.chiefComplaint, symptoms: validated.symptoms, painLevel: validated.painLevel,
      examinationFindings: validated.examinationFindings, clinicalNotes: validated.clinicalNotes,
      medicalHistory: {
        conditions: validated.medicalHistory.existingConditions, allergies: validated.medicalHistory.allergies,
        medications: validated.medicalHistory.medications, surgeries: validated.medicalHistory.previousSurgeries,
        dentalHistory: validated.medicalHistory.dentalHistory, remarks: validated.medicalHistory.remarks,
      },
    };
    const safeSource = this.privacy.redact(JSON.stringify(source), consultation.patientNameSnapshot);
    const raw = await this.provider.generate(this.prompts.build(instructions, safeSource));
    const value = parseResponseObject(raw);
    if (!Array.isArray(value.considerations) || value.considerations.length > 12) throw new ValidationError("AI response field considerations is invalid");
    const considerations = value.considerations.map((row) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) throw new ValidationError("AI response field considerations is invalid");
      const item = row as Record<string, unknown>;
      return { consideration: responseText(item.consideration, "consideration"), rationale: responseText(item.rationale, "rationale") };
    });
    return { summary: responseText(value.summary, "summary"), considerations, questions: responseTextList(value.questions, "questions"), warningSigns: responseTextList(value.warningSigns, "warningSigns") };
  }
}
