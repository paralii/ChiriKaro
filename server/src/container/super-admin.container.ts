import { Role } from "@domain/value-objects/Role.ts";
import { ListClinicsUseCase } from "@application/use-cases/super-admin/list-clinics.use-case.ts";
import { GetClinicDetailsUseCase } from "@application/use-cases/super-admin/get-clinic-details.use-case.ts";
import { UpdateClinicStatusUseCase } from "@application/use-cases/super-admin/update-clinic-status.use-case.ts";
import { GetSuperAdminStatisticsUseCase } from "@application/use-cases/super-admin/get-super-admin-statistics.use-case.ts";
import type { IListClinicsUseCase } from "@application/interfaces/use-cases/super-admin/IListClinicsUseCase.ts";
import type { IGetClinicDetailsUseCase } from "@application/interfaces/use-cases/super-admin/IGetClinicDetailsUseCase.ts";
import type { IUpdateClinicStatusUseCase } from "@application/interfaces/use-cases/super-admin/IUpdateClinicStatusUseCase.ts";
import type { IGetSuperAdminStatisticsUseCase } from "@application/interfaces/use-cases/super-admin/IGetSuperAdminStatisticsUseCase.ts";
import { ClinicRepository } from "@infrastructure/repositories/clinic.repository.ts";
import { SuperAdminClinicRepository, SuperAdminStatisticsRepository } from "@infrastructure/repositories/super-admin.repository.ts";
import { MongoUserRepository } from "@infrastructure/repositories/user.repository.ts";
import { TokenService } from "@infrastructure/services/jwt/jwt.token.service.ts";
import { AuthMiddleware } from "@presentation/middleware/auth.middleware.ts";
import { SuperAdminController } from "@presentation/controllers/super-admin.controller.ts";
import { createSuperAdminRouter } from "@presentation/routes/super-admin.routes.ts";
import { GetClinicDocumentUseCase } from "@application/use-cases/clinic/get-clinic-document.use-case.ts";
import { CloudinaryClinicDocumentStorage } from "@infrastructure/services/storage/cloudinary-clinic-document.storage.ts";

const clinicRepository = new ClinicRepository();
const superAdminClinicRepository = new SuperAdminClinicRepository();
const statisticsRepository = new SuperAdminStatisticsRepository();
const authMiddleware = new AuthMiddleware({
  tokenService: new TokenService(),
  userRepository: new MongoUserRepository(),
  clinicRepository,
});
const listClinicsUseCase: IListClinicsUseCase = new ListClinicsUseCase(superAdminClinicRepository);
const getClinicDetailsUseCase: IGetClinicDetailsUseCase = new GetClinicDetailsUseCase(superAdminClinicRepository);
const updateClinicStatusUseCase: IUpdateClinicStatusUseCase = new UpdateClinicStatusUseCase(superAdminClinicRepository);
const getStatisticsUseCase: IGetSuperAdminStatisticsUseCase = new GetSuperAdminStatisticsUseCase(statisticsRepository);
const getClinicDocumentUseCase = new GetClinicDocumentUseCase(clinicRepository, new CloudinaryClinicDocumentStorage());
const controller = new SuperAdminController(
  listClinicsUseCase,
  getClinicDetailsUseCase,
  updateClinicStatusUseCase,
  getStatisticsUseCase,
  getClinicDocumentUseCase,
);

export const superAdminRouter = createSuperAdminRouter(controller, {
  authenticate: authMiddleware.authenticate,
  authorizeSuperAdmin: authMiddleware.authorize(Role.SUPER_ADMIN),
});
