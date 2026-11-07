import { MongoUserRepository } from "@infrastructure/repositories/user.repository.ts";
import { ClinicRepository } from "@infrastructure/repositories/clinic.repository.ts";
import { TokenService } from "@infrastructure/services/jwt/jwt.token.service.ts";
import { AuthMiddleware } from "@presentation/middleware/auth.middleware.ts";
import { RoleDashboardController } from "@presentation/controllers/role-dashboard.controller.ts";
import { PatientProfileController } from "@presentation/controllers/patient-profile.controller.ts";
import { createRoleDashboardRouter } from "@presentation/routes/role-dashboard.routes.ts";
import { GetRoleDashboardUseCase } from "@application/use-cases/dashboard/get-role-dashboard.use-case.ts";
import { UpdatePatientProfileUseCase } from "@application/use-cases/patient/update-patient-profile.use-case.ts";
import type { IGetRoleDashboardUseCase } from "@application/interfaces/use-cases/dashboard/IGetRoleDashboardUseCase.ts";
import type { IUpdatePatientProfileUseCase } from "@application/interfaces/use-cases/patient/IUpdatePatientProfileUseCase.ts";
import { Role } from "@domain/value-objects/Role.ts";

const userRepository = new MongoUserRepository();
const clinicRepository = new ClinicRepository();
const authMiddleware = new AuthMiddleware({
  tokenService: new TokenService(),
  userRepository,
  clinicRepository,
});

const getRoleDashboardUseCase: IGetRoleDashboardUseCase =
  new GetRoleDashboardUseCase(userRepository, clinicRepository);
const updatePatientProfileUseCase: IUpdatePatientProfileUseCase =
  new UpdatePatientProfileUseCase(userRepository);

const dashboardController = new RoleDashboardController(getRoleDashboardUseCase);
const patientProfileController = new PatientProfileController(updatePatientProfileUseCase);

export const roleDashboardRouter = createRoleDashboardRouter(
  dashboardController,
  patientProfileController,
  {
    authenticate: authMiddleware.authenticate,
    authorizePatient: authMiddleware.authorize(Role.PATIENT),
    authorizeDoctor: authMiddleware.authorize(Role.DOCTOR),
    authorizeStaff: authMiddleware.authorize(Role.STAFF),
  },
);
