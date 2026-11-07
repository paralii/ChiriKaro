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
import type { IDoctorDocumentStorage } from "@application/interfaces/services/IDoctorDocumentStorage.ts";
import { SubmitDoctorVerificationUseCase } from "@application/use-cases/doctor/submit-doctor-verification.use-case.ts";
import type { ISubmitDoctorVerificationUseCase } from "@application/interfaces/use-cases/doctor/ISubmitDoctorVerificationUseCase.ts";
import { ListPendingDoctorVerificationsUseCase } from "@application/use-cases/doctor/list-pending-doctor-verifications.use-case.ts";
import type { IListPendingDoctorVerificationsUseCase } from "@application/interfaces/use-cases/doctor/IListPendingDoctorVerificationsUseCase.ts";
import { GetDoctorVerificationDetailsUseCase } from "@application/use-cases/doctor/get-doctor-verification-details.use-case.ts";
import type { IGetDoctorVerificationDetailsUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorVerificationDetailsUseCase.ts";
import { ApproveDoctorVerificationUseCase } from "@application/use-cases/doctor/approve-doctor-verification.use-case.ts";
import type { IApproveDoctorVerificationUseCase } from "@application/interfaces/use-cases/doctor/IApproveDoctorVerificationUseCase.ts";
import { RejectDoctorVerificationUseCase } from "@application/use-cases/doctor/reject-doctor-verification.use-case.ts";
import type { IRejectDoctorVerificationUseCase } from "@application/interfaces/use-cases/doctor/IRejectDoctorVerificationUseCase.ts";
import { GetClinicDoctorDocumentUseCase } from "@application/use-cases/doctor/get-clinic-doctor-document.use-case.ts";
import type { IGetClinicDoctorDocumentUseCase } from "@application/interfaces/use-cases/doctor/IGetClinicDoctorDocumentUseCase.ts";
import { GetDoctorConsultationFeeUseCase } from "@application/use-cases/doctor/get-doctor-consultation-fee.use-case.ts";
import type { IGetDoctorConsultationFeeUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorConsultationFeeUseCase.ts";
import { UpdateDoctorConsultationFeeUseCase } from "@application/use-cases/doctor/update-doctor-consultation-fee.use-case.ts";
import type { IUpdateDoctorConsultationFeeUseCase } from "@application/interfaces/use-cases/doctor/IUpdateDoctorConsultationFeeUseCase.ts";

const doctorRepository = new DoctorRepository();
const clinicRepository = new ClinicRepository();
const userRepository = new MongoUserRepository();
const documentStorage: IDoctorDocumentStorage = new CloudinaryDoctorDocumentStorage();

const getDoctorOnboardingUseCase: IGetDoctorOnboardingUseCase =
  new GetDoctorOnboardingUseCase(doctorRepository);
const updateDoctorOnboardingUseCase: IUpdateDoctorOnboardingUseCase =
  new UpdateDoctorOnboardingUseCase(doctorRepository);
const uploadDoctorDocumentUseCase: IUploadDoctorDocumentUseCase =
  new UploadDoctorDocumentUseCase(doctorRepository, documentStorage);
const getDoctorDocumentUseCase: IGetDoctorDocumentUseCase =
  new GetDoctorDocumentUseCase(doctorRepository, documentStorage);
const submitDoctorVerificationUseCase: ISubmitDoctorVerificationUseCase =
  new SubmitDoctorVerificationUseCase(doctorRepository);
const listPendingDoctorVerificationsUseCase: IListPendingDoctorVerificationsUseCase =
  new ListPendingDoctorVerificationsUseCase(doctorRepository);
const getDoctorVerificationDetailsUseCase: IGetDoctorVerificationDetailsUseCase =
  new GetDoctorVerificationDetailsUseCase(doctorRepository);
const approveDoctorVerificationUseCase: IApproveDoctorVerificationUseCase =
  new ApproveDoctorVerificationUseCase(doctorRepository);
const rejectDoctorVerificationUseCase: IRejectDoctorVerificationUseCase =
  new RejectDoctorVerificationUseCase(doctorRepository);
const getClinicDoctorDocumentUseCase: IGetClinicDoctorDocumentUseCase =
  new GetClinicDoctorDocumentUseCase(doctorRepository, documentStorage);
const getDoctorConsultationFeeUseCase: IGetDoctorConsultationFeeUseCase =
  new GetDoctorConsultationFeeUseCase(doctorRepository);
const updateDoctorConsultationFeeUseCase: IUpdateDoctorConsultationFeeUseCase =
  new UpdateDoctorConsultationFeeUseCase(doctorRepository);

const controller = new DoctorController(
  getDoctorOnboardingUseCase,
  updateDoctorOnboardingUseCase,
  uploadDoctorDocumentUseCase,
  getDoctorDocumentUseCase,
  submitDoctorVerificationUseCase,
  listPendingDoctorVerificationsUseCase,
  getDoctorVerificationDetailsUseCase,
  approveDoctorVerificationUseCase,
  rejectDoctorVerificationUseCase,
  getClinicDoctorDocumentUseCase,
  getDoctorConsultationFeeUseCase,
  updateDoctorConsultationFeeUseCase,
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
