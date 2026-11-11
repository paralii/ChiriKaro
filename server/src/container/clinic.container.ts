import { ClinicController } from "@presentation/controllers/clinic.controller.ts";
import { ClinicRouter } from "@presentation/routes/clinic.routes.ts";

import { ClinicRepository } from "@infrastructure/repositories/clinic.repository.ts";
import { MongoUserRepository } from "@infrastructure/repositories/user.repository.ts";
import { DoctorRepository } from "@infrastructure/repositories/doctor.repository.ts";
import { PasswordService } from "@infrastructure/services/bcrypt/bcrypt.password.service.ts";
import { OtpService } from "@infrastructure/services/otp.service.ts";
import { RedisService } from "@infrastructure/redis/redis.service.ts";
import { EmailService } from "@infrastructure/email/email.service.ts";
import { TokenService } from "@infrastructure/services/jwt/jwt.token.service.ts";
import { AuthMiddleware } from "@presentation/middleware/auth.middleware.ts";
import { Role } from "@domain/value-objects/Role.ts";
import { CloudinaryDoctorDocumentStorage } from "@infrastructure/services/storage/cloudinary-doctor-document.storage.ts";

import { RegisterClinicUseCase } from "@application/use-cases/clinic/register-clinic.use-case.ts";
import type { IRegisterClinicUseCase } from "@application/interfaces/use-cases/clinic/IRegisterClinicUseCase.ts";
import { GetClinicProfileUseCase } from "@application/use-cases/clinic/get-clinic-profile.use-case.ts";
import type { IGetClinicProfileUseCase } from "@application/interfaces/use-cases/clinic/IGetClinicProfileUseCase.ts";
import { UpdateClinicProfileUseCase } from "@application/use-cases/clinic/update-clinic-profile.use-case.ts";
import type { IUpdateClinicProfileUseCase } from "@application/interfaces/use-cases/clinic/IUpdateClinicProfileUseCase.ts";
import { GetClinicDashboardUseCase } from "@application/use-cases/clinic/get-clinic-dashboard.use-case.ts";
import type { IGetClinicDashboardUseCase } from "@application/interfaces/use-cases/clinic/IGetClinicDashboardUseCase.ts";
import { UpdateClinicSetupUseCase } from "@application/use-cases/clinic/update-clinic-setup.use-case.ts";
import { SubmitClinicSetupUseCase } from "@application/use-cases/clinic/submit-clinic-setup.use-case.ts";
import { UploadClinicDocumentUseCase } from "@application/use-cases/clinic/upload-clinic-document.use-case.ts";
import { GetClinicDocumentUseCase } from "@application/use-cases/clinic/get-clinic-document.use-case.ts";
import type { IUpdateClinicSetupUseCase } from "@application/interfaces/use-cases/clinic/IUpdateClinicSetupUseCase.ts";
import type { ISubmitClinicSetupUseCase } from "@application/interfaces/use-cases/clinic/ISubmitClinicSetupUseCase.ts";
import type { IUploadClinicDocumentUseCase } from "@application/interfaces/use-cases/clinic/IUploadClinicDocumentUseCase.ts";
import type { IGetClinicDocumentUseCase } from "@application/interfaces/use-cases/clinic/IGetClinicDocumentUseCase.ts";
import { CloudinaryClinicDocumentStorage } from "@infrastructure/services/storage/cloudinary-clinic-document.storage.ts";
import { UpdateDoctorConsultationFeeUseCase } from "@application/use-cases/doctor/update-doctor-consultation-fee.use-case.ts";
import type { IUpdateDoctorConsultationFeeUseCase } from "@application/interfaces/use-cases/doctor/IUpdateDoctorConsultationFeeUseCase.ts";
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
import type { IDoctorDocumentStorage } from "@application/interfaces/services/IDoctorDocumentStorage.ts";

const clinicRepository = new ClinicRepository();
const userRepository = new MongoUserRepository();
const doctorRepository = new DoctorRepository();
const passwordService = new PasswordService();
const otpService = new OtpService();
const otpRepository = new RedisService();
const emailService = new EmailService();
const documentStorage: IDoctorDocumentStorage =
  new CloudinaryDoctorDocumentStorage();

const registerClinicUseCase: IRegisterClinicUseCase = new RegisterClinicUseCase(
  clinicRepository,
  userRepository,
  passwordService,
  otpService,
  otpRepository,
  emailService,
);

const getClinicProfileUseCase: IGetClinicProfileUseCase =
  new GetClinicProfileUseCase(clinicRepository);
const updateClinicProfileUseCase: IUpdateClinicProfileUseCase =
  new UpdateClinicProfileUseCase(clinicRepository);
const getClinicDashboardUseCase: IGetClinicDashboardUseCase =
  new GetClinicDashboardUseCase(clinicRepository, userRepository);
const clinicDocumentStorage = new CloudinaryClinicDocumentStorage();
const updateClinicSetupUseCase: IUpdateClinicSetupUseCase =
  new UpdateClinicSetupUseCase(clinicRepository);
const submitClinicSetupUseCase: ISubmitClinicSetupUseCase =
  new SubmitClinicSetupUseCase(clinicRepository);
const uploadClinicDocumentUseCase: IUploadClinicDocumentUseCase =
  new UploadClinicDocumentUseCase(clinicRepository, clinicDocumentStorage);
const getClinicDocumentUseCase: IGetClinicDocumentUseCase =
  new GetClinicDocumentUseCase(clinicRepository, clinicDocumentStorage);
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
const updateDoctorConsultationFeeUseCase: IUpdateDoctorConsultationFeeUseCase =
  new UpdateDoctorConsultationFeeUseCase(doctorRepository);

export const clinicController = new ClinicController(
  registerClinicUseCase,
  getClinicProfileUseCase,
  updateClinicProfileUseCase,
  getClinicDashboardUseCase,
  updateClinicSetupUseCase,
  submitClinicSetupUseCase,
  uploadClinicDocumentUseCase,
  getClinicDocumentUseCase,
  listPendingDoctorVerificationsUseCase,
  getDoctorVerificationDetailsUseCase,
  approveDoctorVerificationUseCase,
  rejectDoctorVerificationUseCase,
  getClinicDoctorDocumentUseCase,
  updateDoctorConsultationFeeUseCase,
);

const authMiddleware = new AuthMiddleware({
  tokenService: new TokenService(),
  userRepository,
  clinicRepository,
});

export const clinicRouter = ClinicRouter(clinicController, {
  authenticate: authMiddleware.authenticate,
  authorizeClinicAdmin: authMiddleware.authorize(Role.CLINIC_ADMIN),
});
