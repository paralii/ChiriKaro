import { ClinicController } from "@presentation/controllers/clinic.controller.ts";
import { ClinicRouter } from "@presentation/routes/clinic.routes.ts";

import { ClinicRepository } from "@infrastructure/repositories/clinic.repository.ts";
import { MongoUserRepository } from "@infrastructure/repositories/user.repository.ts";
import { PasswordService } from "@infrastructure/services/bcrypt/bcrypt.password.service.ts";
import { OtpService } from "@infrastructure/services/otp.service.ts";
import { RedisService } from "@infrastructure/redis/redis.service.ts";
import { EmailService } from "@infrastructure/email/email.service.ts";

import { RegisterClinicUseCase } from "@application/use-cases/clinic/register-clinic.use-case.ts";
import type { IRegisterClinicUseCase } from "@application/interfaces/use-cases/clinic/IRegisterClinicUseCase.ts";

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

export const clinicController = new ClinicController(registerClinicUseCase);

export const clinicRouter = ClinicRouter(clinicController);
