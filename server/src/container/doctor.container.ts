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

const controller = new DoctorController(
  getDoctorOnboardingUseCase,
  updateDoctorOnboardingUseCase,
  uploadDoctorDocumentUseCase,
  getDoctorDocumentUseCase,
);

const authMiddleware = new AuthMiddleware({
  tokenService: new TokenService(),
  userRepository,
  clinicRepository,
});

export const doctorRouter = DoctorRouter(controller, {
  authenticate: authMiddleware.authenticate,
  authorizeDoctor: authMiddleware.authorize(Role.DOCTOR),
});
