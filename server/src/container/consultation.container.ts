import { Role } from "@domain/value-objects/Role.ts";
import { ConsultationRepository } from "@infrastructure/repositories/consultation.repository.ts";
import { QueueRepository } from "@infrastructure/repositories/queue.repository.ts";
import { AppointmentRepository } from "@infrastructure/repositories/appointment.repository.ts";
import { MongoUserRepository } from "@infrastructure/repositories/user.repository.ts";
import { CloudinaryDocumentStorage } from "@infrastructure/services/storage/cloudinary-document.storage.ts";
import { DoctorRepository } from "@infrastructure/repositories/doctor.repository.ts";
import { ClinicRepository } from "@infrastructure/repositories/clinic.repository.ts";
import { QueueClinicContextService } from "@application/services/queue-clinic-context.service.ts";
import { ConsultationUseCase } from "@application/use-cases/consultation/consultation.use-case.ts";
import { ConsultationController } from "@presentation/controllers/consultation.controller.ts";
import { ConsultationRouter, PatientPrescriptionRouter } from "@presentation/routes/consultation.routes.ts";
import { AuthMiddleware } from "@presentation/middleware/auth.middleware.ts";
import { TokenService } from "@infrastructure/services/jwt/jwt.token.service.ts";
import { AIAssistanceController } from "@presentation/controllers/ai-assistance.controller.ts";
import { AIAssistanceUseCase } from "@application/use-cases/consultation/ai-assistance.use-case.ts";
import { AIClinicalContextRepository } from "@infrastructure/repositories/ai-clinical-context.repository.ts";
import { createAIProvider } from "@container/ai-provider.factory.ts";
import { env } from "@infrastructure/config/env.ts";
import { MongoObjectIdValidator } from "@infrastructure/services/mongo-object-id.validator.ts";
import { AIClinicalContextService } from "@application/services/ai/AIClinicalContextService.ts";
import { AIInputValidator } from "@application/services/ai/AIInputValidator.ts";
import { AIPrivacyFilter } from "@application/services/ai/AIPrivacyFilter.ts";
import { AIPromptBuilder } from "@application/services/ai/AIPromptBuilder.ts";
import { SymptomAnalysisHandler } from "@application/use-cases/consultation/handlers/SymptomAnalysisHandler.ts";
import { PatientBriefHandler } from "@application/use-cases/consultation/handlers/PatientBriefHandler.ts";
import { PatientInsightsHandler } from "@application/use-cases/consultation/handlers/PatientInsightsHandler.ts";
const clinics = new ClinicRepository();
const doctors = new DoctorRepository();
const users = new MongoUserRepository();
const auth = new AuthMiddleware({ tokenService: new TokenService(), userRepository: users, clinicRepository: clinics });
const clinicContext = new QueueClinicContextService(clinics, doctors);
const consultationRepository = new ConsultationRepository();
const consultationUseCase = new ConsultationUseCase(consultationRepository, new QueueRepository(), users, clinicContext, new CloudinaryDocumentStorage("patient-records"), new AppointmentRepository());
const aiProvider = createAIProvider(env.AI_PROVIDER, { apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL });
const aiClinicalContext = new AIClinicalContextService(new AIClinicalContextRepository(), users);
const aiPrivacyFilter = new AIPrivacyFilter();
const aiPromptBuilder = new AIPromptBuilder();
const aiHandlers = {
  symptomAnalysis: new SymptomAnalysisHandler(aiProvider, new AIInputValidator(), aiPrivacyFilter, aiPromptBuilder),
  patientBrief: new PatientBriefHandler(aiProvider, aiClinicalContext, aiPrivacyFilter, aiPromptBuilder),
  insights: new PatientInsightsHandler(aiProvider, aiClinicalContext, aiPrivacyFilter, aiPromptBuilder),
};
const aiUseCase = new AIAssistanceUseCase(consultationRepository, new MongoObjectIdValidator(), clinicContext, aiHandlers);
export const consultationRouter = ConsultationRouter(new ConsultationController(consultationUseCase), auth.authenticate, auth.authorize(Role.DOCTOR), new AIAssistanceController(aiUseCase));
export const patientPrescriptionRouter = PatientPrescriptionRouter(new ConsultationController(new ConsultationUseCase(new ConsultationRepository(), new QueueRepository(), users, new QueueClinicContextService(clinics, doctors), new CloudinaryDocumentStorage("patient-records"), new AppointmentRepository())), auth.authenticate, auth.authorize(Role.PATIENT));
