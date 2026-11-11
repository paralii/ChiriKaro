import { Role } from "@domain/value-objects/Role.ts";
import { DoctorRepository } from "@infrastructure/repositories/doctor.repository.ts";
import { ClinicRepository } from "@infrastructure/repositories/clinic.repository.ts";
import { MongoUserRepository } from "@infrastructure/repositories/user.repository.ts";
import { TokenService } from "@infrastructure/services/jwt/jwt.token.service.ts";
import { CloudinaryDoctorDocumentStorage } from "@infrastructure/services/storage/cloudinary-doctor-document.storage.ts";
import { AuthMiddleware } from "@presentation/middleware/auth.middleware.ts";
import { DoctorController } from "@presentation/controllers/doctor.controller.ts";
import { DoctorRouter } from "@presentation/routes/doctor.routes.ts";

import { GetDoctorOnboardingUseCase } from "@application/use-cases/doctor/get-doctor-onboarding.use-case.ts";
import type { IGetDoctorOnboardingUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorOnboardingUseCase.ts";
import { UpdateDoctorOnboardingUseCase } from "@application/use-cases/doctor/update-doctor-onboarding.use-case.ts";
import type { IUpdateDoctorOnboardingUseCase } from "@application/interfaces/use-cases/doctor/IUpdateDoctorOnboardingUseCase.ts";
import { UploadDoctorDocumentUseCase } from "@application/use-cases/doctor/upload-doctor-document.use-case.ts";
import type { IUploadDoctorDocumentUseCase } from "@application/interfaces/use-cases/doctor/IUploadDoctorDocumentUseCase.ts";
import { GetDoctorDocumentUseCase } from "@application/use-cases/doctor/get-doctor-document.use-case.ts";
import type { IGetDoctorDocumentUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorDocumentUseCase.ts";
import { DeleteDoctorDocumentUseCase } from "@application/use-cases/doctor/delete-doctor-document.use-case.ts";
import type { IDeleteDoctorDocumentUseCase } from "@application/interfaces/use-cases/doctor/IDeleteDoctorDocumentUseCase.ts";
import type { IDoctorDocumentStorage } from "@application/interfaces/services/IDoctorDocumentStorage.ts";
import { SubmitDoctorVerificationUseCase } from "@application/use-cases/doctor/submit-doctor-verification.use-case.ts";
import type { ISubmitDoctorVerificationUseCase } from "@application/interfaces/use-cases/doctor/ISubmitDoctorVerificationUseCase.ts";
import { GetDoctorConsultationFeeUseCase } from "@application/use-cases/doctor/get-doctor-consultation-fee.use-case.ts";
import type { IGetDoctorConsultationFeeUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorConsultationFeeUseCase.ts";
import { GetDoctorAvailabilityUseCase } from "@application/use-cases/doctor/get-doctor-availability.use-case.ts";
import type { IGetDoctorAvailabilityUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorAvailabilityUseCase.ts";
import { ConfigureDoctorAvailabilityUseCase } from "@application/use-cases/doctor/configure-doctor-availability.use-case.ts";
import type { IConfigureDoctorAvailabilityUseCase } from "@application/interfaces/use-cases/doctor/IConfigureDoctorAvailabilityUseCase.ts";
import { GenerateDoctorAvailabilitySlotsUseCase } from "@application/use-cases/doctor/generate-doctor-availability-slots.use-case.ts";
import type { IGenerateDoctorAvailabilitySlotsUseCase } from "@application/interfaces/use-cases/doctor/IGenerateDoctorAvailabilitySlotsUseCase.ts";

const doctorRepository = new DoctorRepository();
const clinicRepository = new ClinicRepository();
const userRepository = new MongoUserRepository();
const documentStorage: IDoctorDocumentStorage =
  new CloudinaryDoctorDocumentStorage();

const getDoctorOnboardingUseCase: IGetDoctorOnboardingUseCase =
  new GetDoctorOnboardingUseCase(doctorRepository);
const updateDoctorOnboardingUseCase: IUpdateDoctorOnboardingUseCase =
  new UpdateDoctorOnboardingUseCase(doctorRepository);
const uploadDoctorDocumentUseCase: IUploadDoctorDocumentUseCase =
  new UploadDoctorDocumentUseCase(doctorRepository, documentStorage);
const getDoctorDocumentUseCase: IGetDoctorDocumentUseCase =
  new GetDoctorDocumentUseCase(doctorRepository, documentStorage);
const deleteDoctorDocumentUseCase: IDeleteDoctorDocumentUseCase =
  new DeleteDoctorDocumentUseCase(doctorRepository, documentStorage);
const submitDoctorVerificationUseCase: ISubmitDoctorVerificationUseCase =
  new SubmitDoctorVerificationUseCase(doctorRepository);
const getDoctorConsultationFeeUseCase: IGetDoctorConsultationFeeUseCase =
  new GetDoctorConsultationFeeUseCase(doctorRepository);
const getDoctorAvailabilityUseCase: IGetDoctorAvailabilityUseCase =
  new GetDoctorAvailabilityUseCase(doctorRepository);
const configureDoctorAvailabilityUseCase: IConfigureDoctorAvailabilityUseCase =
  new ConfigureDoctorAvailabilityUseCase(doctorRepository, clinicRepository);
const generateDoctorAvailabilitySlotsUseCase: IGenerateDoctorAvailabilitySlotsUseCase =
  new GenerateDoctorAvailabilitySlotsUseCase(doctorRepository);

const controller = new DoctorController(
  getDoctorOnboardingUseCase,
  updateDoctorOnboardingUseCase,
  uploadDoctorDocumentUseCase,
  getDoctorDocumentUseCase,
  deleteDoctorDocumentUseCase,
  submitDoctorVerificationUseCase,
  getDoctorConsultationFeeUseCase,
  getDoctorAvailabilityUseCase,
  configureDoctorAvailabilityUseCase,
  generateDoctorAvailabilitySlotsUseCase,
);

const authMiddleware = new AuthMiddleware({
  tokenService: new TokenService(),
  userRepository,
  clinicRepository,
});

export const doctorRouter = DoctorRouter(controller, {
  authenticate: authMiddleware.authenticate,
  authorizeDoctor: authMiddleware.authorize(Role.DOCTOR),
  authorizeClinicAdmin: authMiddleware.authorize(Role.CLINIC_ADMIN),
});
