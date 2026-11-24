import type { ConsultationRecord } from "@domain/entities/consultation.entity.ts";
import type { IAIConsultationLookupRepository } from "@application/interfaces/repositories/IAIConsultationLookupRepository.ts";
import type { IQueueClinicContext } from "@application/interfaces/services/IQueueClinicContext.ts";
import type { IIdentifierValidator } from "@application/interfaces/services/IIdentifierValidator.ts";
import type { AIAssistanceFeatureHandlers, IAIAssistanceFeatureHandler } from "@application/interfaces/services/IAIAssistanceFeatureHandler.ts";
import type { PatientBriefDTO, PatientInsightsDTO, SymptomAnalysisDTO } from "@application/dto/consultation/ai-assistance.dto.ts";
import { BadRequestError, ForbiddenError, NotFoundError } from "@shared/errors/index.ts";

export class AIAssistanceUseCase {
  constructor(
    private readonly consultations: IAIConsultationLookupRepository,
    private readonly identifiers: IIdentifierValidator,
    private readonly clinicContext: IQueueClinicContext,
    private readonly handlers: AIAssistanceFeatureHandlers,
  ) {}

  symptomAnalysis(id: string, clinicId: string, doctorUserId: string, input?: unknown): Promise<SymptomAnalysisDTO> {
    return this.execute(this.handlers.symptomAnalysis, id, clinicId, doctorUserId, input);
  }

  patientBrief(id: string, clinicId: string, doctorUserId: string): Promise<PatientBriefDTO> {
    return this.execute(this.handlers.patientBrief, id, clinicId, doctorUserId);
  }

  insights(id: string, clinicId: string, doctorUserId: string): Promise<PatientInsightsDTO> {
    return this.execute(this.handlers.insights, id, clinicId, doctorUserId);
  }

  async freshness(feature: "symptoms" | "brief" | "insights", id: string, clinicId: string, doctorUserId: string, previousFingerprint: unknown, input?: unknown): Promise<{ current: boolean; inputFingerprint: string }> {
    const handlers = { symptoms: this.handlers.symptomAnalysis, brief: this.handlers.patientBrief, insights: this.handlers.insights };
    const handler = handlers[feature];
    const consultation = await this.authorizedConsultation(id, clinicId, doctorUserId);
    const inputFingerprint = await handler.fingerprint(consultation, input);
    return { current: typeof previousFingerprint === "string" && previousFingerprint === inputFingerprint, inputFingerprint };
  }

  private async execute<TResult>(
    handler: IAIAssistanceFeatureHandler<TResult>, id: string, clinicId: string, doctorUserId: string, input?: unknown,
  ): Promise<TResult> {
    const consultation = await this.authorizedConsultation(id, clinicId, doctorUserId);
    return handler.execute(consultation, input);
  }

  private async authorizedConsultation(id: string, clinicId: string, doctorUserId: string): Promise<ConsultationRecord> {
    if (![id, clinicId, doctorUserId].every((value) => this.identifiers.isValid(value))) throw new BadRequestError("Consultation identity is invalid");
    await this.clinicContext.getOperationalClinic(clinicId);
    await this.clinicContext.getVerifiedDoctor(clinicId, doctorUserId);
    const consultation: ConsultationRecord | null = await this.consultations.findById(id, clinicId);
    if (!consultation || consultation.clinicId !== clinicId) throw new NotFoundError("Consultation");
    if (consultation.doctorUserId !== doctorUserId) throw new ForbiddenError("Doctors can only access their own consultations");
    return consultation;
  }
}
