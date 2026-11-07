import { ListClinicsUseCase } from "@application/use-cases/super-admin/list-clinics.use-case.ts";
import { GetClinicDetailsUseCase } from "@application/use-cases/super-admin/get-clinic-details.use-case.ts";
import { UpdateClinicStatusUseCase } from "@application/use-cases/super-admin/update-clinic-status.use-case.ts";
import type { IListClinicsUseCase } from "@application/interfaces/use-cases/super-admin/IListClinicsUseCase.ts";
import type { IGetClinicDetailsUseCase } from "@application/interfaces/use-cases/super-admin/IGetClinicDetailsUseCase.ts";
import type { IUpdateClinicStatusUseCase } from "@application/interfaces/use-cases/super-admin/IUpdateClinicStatusUseCase.ts";
import { ClinicRepository } from "@infrastructure/repositories/clinic.repository.ts";
import { MongoUserRepository } from "@infrastructure/repositories/user.repository.ts";
import { TokenService } from "@infrastructure/services/jwt/jwt.token.service.ts";
import { AuthMiddleware } from "@presentation/middleware/auth.middleware.ts";
import { SuperAdminClinicController } from "@presentation/controllers/super-admin-clinic.controller.ts";
import { createSuperAdminClinicRouter } from "@presentation/routes/super-admin-clinic.routes.ts";
import { Role } from "@domain/value-objects/Role.ts";

const clinicRepository = new ClinicRepository();
const authMiddleware = new AuthMiddleware({
  tokenService: new TokenService(),
  userRepository: new MongoUserRepository(),
  clinicRepository,
});

const listClinicsUseCase: IListClinicsUseCase = new ListClinicsUseCase(clinicRepository);
const getClinicDetailsUseCase: IGetClinicDetailsUseCase =
  new GetClinicDetailsUseCase(clinicRepository);
const updateClinicStatusUseCase: IUpdateClinicStatusUseCase =
  new UpdateClinicStatusUseCase(clinicRepository);

const controller = new SuperAdminClinicController(
  listClinicsUseCase,
  getClinicDetailsUseCase,
  updateClinicStatusUseCase,
);

export const superAdminClinicRouter = createSuperAdminClinicRouter(controller, {
  authenticate: authMiddleware.authenticate,
  authorizeSuperAdmin: authMiddleware.authorize(Role.SUPER_ADMIN),
});
