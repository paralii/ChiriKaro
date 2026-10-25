import { MongoUserRepository } from "@infrastructure/repositories/user.repository.ts";
import { ClinicRepository } from "@infrastructure/repositories/clinic.repository.ts";

import { PasswordService } from "@infrastructure/services/bcrypt/bcrypt.password.service.ts";
import { TokenService } from "@infrastructure/services/jwt/jwt.token.service.ts";
import { OtpService } from "@infrastructure/services/otp.service.ts";
import { EmailService } from "@infrastructure/email/email.service.ts";
import { IdGenerator } from "@infrastructure/services/UuidGenerator.ts";
import { MongoPasswordResetTokenRepository } from "@infrastructure/database/mongodb/mongo-password-reset-token.repository.ts";
import { PasswordResetTokenService } from "@infrastructure/services/password-reset-token.service.ts";
import { PasswordResetLinkGenerator } from "@infrastructure/services/password-reset-link-generator.service.ts";
import { RedisService } from "@infrastructure/redis/redis.service.ts";

import { LoginUseCase } from "@application/use-cases/auth/login.use-case.ts";
import { RegisterUseCase } from "@application/use-cases/auth/register.use-case.ts";
import { LogoutUseCase } from "@application/use-cases/auth/logout.use-case.ts";
import { GetProfileUseCase } from "@application/use-cases/auth/get-profile.use-case.ts";
import { RefreshTokenUseCase } from "@application/use-cases/auth/refresh-token.use-case.ts";
import { ForgotPasswordUseCase } from "@application/use-cases/auth/forgot-password.use-case.ts";
import { ResetPasswordUseCase } from "@application/use-cases/auth/reset-password.use-case.ts";
import { VerifyOtpUseCase } from "@application/use-cases/auth/verify-otp.use-case.ts";
import { ResendOtpUseCase } from "@application/use-cases/auth/resend-otp.use-case.ts";
import { GoogleAuthUseCase } from "@application/use-cases/auth/google-auth.use-case.ts";
import { ChangePasswordUseCase } from "@application/use-cases/auth/change-password.use-case.ts";

import { AuthController } from "@presentation/controllers/auth.controller.ts";
import { createAuthRouter } from "@presentation/routes/auth.routes.ts";
import { AuthMiddleware  } from "@presentation/middleware/auth.middleware.ts";

const userRepository = new MongoUserRepository();
const clinicRepository = new ClinicRepository();
const passwordService = new PasswordService();
const tokenService = new TokenService();
const otpService = new OtpService();
const otpRepository = new RedisService();
const emailService = new EmailService();
const idGenerator = new IdGenerator();
const passwordResetTokenRepository = new MongoPasswordResetTokenRepository();
const passwordResetTokenService = new PasswordResetTokenService();
const passwordResetLinkGenerator = new PasswordResetLinkGenerator();

const registerUseCase = new RegisterUseCase(
  userRepository,
  passwordService,
  otpService,
  otpRepository,
  emailService,
  idGenerator,
);

const loginUseCase = new LoginUseCase(
  userRepository,
  passwordService,
  tokenService,
);

const logoutUseCase = new LogoutUseCase(tokenService);

const getProfileUseCase = new GetProfileUseCase(userRepository);

const refreshTokenUseCase = new RefreshTokenUseCase(
  userRepository,
  tokenService,
);

const forgotPasswordUseCase = new ForgotPasswordUseCase(
  userRepository,
  passwordResetTokenRepository,
  passwordResetTokenService,
  emailService,
  passwordResetLinkGenerator,
);

const resetPasswordUseCase = new ResetPasswordUseCase(
  userRepository,
  passwordResetTokenRepository,
  passwordService,
  passwordResetTokenService,
);

const verifyOtpUseCase = new VerifyOtpUseCase(
  userRepository,
  otpRepository,
  otpService,
);

const resendOtpUseCase = new ResendOtpUseCase(
  userRepository,
  otpRepository,
  otpService,
  emailService,
);

const googleAuthUseCase = new GoogleAuthUseCase(
  userRepository,
  tokenService,
  idGenerator,
);

const changePasswordUseCase = new ChangePasswordUseCase(
  userRepository,
  passwordService,
);

export const authController = new AuthController(
  registerUseCase,
  loginUseCase,
  logoutUseCase,
  getProfileUseCase,
  refreshTokenUseCase,
  forgotPasswordUseCase,
  resetPasswordUseCase,
  verifyOtpUseCase,
  resendOtpUseCase,
  googleAuthUseCase,
  changePasswordUseCase,
);

const authMiddleware = new AuthMiddleware({
  tokenService,
  userRepository,
  clinicRepository
});
export const authRouter = createAuthRouter(authController, {
  authenticate: authMiddleware.authenticate,
//   googleRedirect,
//   googleAuthenticate,
});
