import { ClinicController } from "@presentation/controllers/clinic.controller.ts";
import { ClinicRouter } from "@presentation/routes/clinic.routes.ts";

import { ClinicRepository } from "@infrastructure/repositories/clinic.repository.ts";
import { MongoUserRepository } from "@infrastructure/repositories/user.repository.ts";
import { PasswordService } from "@infrastructure/services/bcrypt/bcrypt.password.service.ts";
import { OtpService } from "@infrastructure/services/otp.service.ts";
import { RedisService } from "@infrastructure/redis/redis.service.ts";
import { EmailService } from "@infrastructure/email/email.service.ts";
import { TokenService } from "@infrastructure/services/jwt/jwt.token.service.ts";
import { AuthMiddleware } from "@presentation/middleware/auth.middleware.ts";
import { Role } from "@domain/value-objects/Role.ts";

import { RegisterClinicUseCase } from "@application/use-cases/clinic/register-clinic.use-case.ts";
import type { IRegisterClinicUseCase } from "@application/interfaces/use-cases/clinic/IRegisterClinicUseCase.ts";
import { GetClinicProfileUseCase } from "@application/use-cases/clinic/get-clinic-profile.use-case.ts";
import type { IGetClinicProfileUseCase } from "@application/interfaces/use-cases/clinic/IGetClinicProfileUseCase.ts";
import { UpdateClinicProfileUseCase } from "@application/use-cases/clinic/update-clinic-profile.use-case.ts";
import type { IUpdateClinicProfileUseCase } from "@application/interfaces/use-cases/clinic/IUpdateClinicProfileUseCase.ts";
import { GetClinicDashboardUseCase } from "@application/use-cases/clinic/get-clinic-dashboard.use-case.ts";
import type { IGetClinicDashboardUseCase } from "@application/interfaces/use-cases/clinic/IGetClinicDashboardUseCase.ts";

const clinicRepository = new ClinicRepository();
const userRepository = new MongoUserRepository();
const passwordService = new PasswordService();
const otpService = new OtpService();
const otpRepository = new RedisService();
const emailService = new EmailService();

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

export const clinicController = new ClinicController(
  registerClinicUseCase,
  getClinicProfileUseCase,
  updateClinicProfileUseCase,
  getClinicDashboardUseCase,
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
