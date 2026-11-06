import { AuthController } from "@presentation/controllers/auth.controller.ts";

import { MongoUserRepository } from "@infrastructure/repositories/user.repository.ts";
import { ClinicRepository } from "@infrastructure/repositories/clinic.repository.ts";

import { PasswordService } from "@infrastructure/services/bcrypt/bcrypt.password.service.ts";
import { TokenService } from "@infrastructure/services/jwt/jwt.token.service.ts";
import { OtpService } from "@infrastructure/services/otp.service.ts";
import { EmailService } from "@infrastructure/email/email.service.ts";
import { PasswordResetTokenService } from "@infrastructure/services/password-reset-token.service.ts";
import { PasswordResetLinkGenerator } from "@infrastructure/services/password-reset-link-generator.service.ts";
import { RedisService } from "@infrastructure/redis/redis.service.ts";
import { GoogleOAuthService } from "@infrastructure/oauth/google-oauth.service.ts";

import { MongoPasswordResetTokenRepository } from "@infrastructure/repositories/password-reset-token.repository.ts";

import { LoginUseCase } from "@application/use-cases/auth/login.use-case.ts";
import type { ILoginUseCase } from "@application/interfaces/use-cases/auth/ILoginUseCase.ts";

import { RegisterUseCase } from "@application/use-cases/auth/register.use-case.ts";
import type { IRegisterUseCase } from "@application/interfaces/use-cases/auth/IRegisterUseCase.ts";

import { VerifyOtpUseCase } from "@application/use-cases/auth/verify-otp.use-case.ts";
import type { IVerifyOtpUseCase } from "@application/interfaces/use-cases/auth/IVerifyOtpUseCase.ts";

import { ResendOtpUseCase } from "@application/use-cases/auth/resend-otp.use-case.ts";
import type { IResendOtpUseCase } from "@application/interfaces/use-cases/auth/IResendOtpUseCase.ts";

import { ForgotPasswordUseCase } from "@application/use-cases/auth/forgot-password.use-case.ts";
import type { IForgotPasswordUseCase } from "@application/interfaces/use-cases/auth/IForgotPasswordUseCase.ts";

import { ResetPasswordUseCase } from "@application/use-cases/auth/reset-password.use-case.ts";
import type { IResetPasswordUseCase } from "@application/interfaces/use-cases/auth/IResetPasswordUseCase.ts";

import { GoogleAuthUseCase } from "@application/use-cases/auth/google-auth.use-case.ts";
import type { IGoogleAuthUseCase } from "@application/interfaces/use-cases/auth/IGoogleAuthUseCase.ts";

import { RefreshTokenUseCase } from "@application/use-cases/auth/refresh-token.use-case.ts";
import type { IRefreshTokenUseCase } from "@application/interfaces/use-cases/auth/IRefreshTokenUseCase.ts";

import { LogoutUseCase } from "@application/use-cases/auth/logout.use-case.ts";
import type { ILogoutUseCase } from "@application/interfaces/use-cases/auth/ILogoutUseCase.ts";

import { GetProfileUseCase } from "@application/use-cases/auth/get-profile.use-case.ts";
import type { IGetProfileUseCase } from "@application/interfaces/use-cases/auth/IGetProfileUseCase.ts";

import { ChangePasswordUseCase } from "@application/use-cases/auth/change-password.use-case.ts";
import type { IChangePasswordUseCase } from "@application/interfaces/use-cases/auth/IChangePasswordUseCase.ts";

import { createAuthRouter } from "@presentation/routes/auth.routes.ts";

import { AuthMiddleware } from "@presentation/middleware/auth.middleware.ts";
import { GoogleOAuthMiddleware } from "@presentation/middleware/google-oauth.middleware.ts";

const userRepository = new MongoUserRepository();
const clinicRepository = new ClinicRepository();
const passwordService = new PasswordService();
const tokenService = new TokenService();
const googleOAuthService = new GoogleOAuthService();
const otpService = new OtpService();
const otpRepository = new RedisService();
const emailService = new EmailService();
const passwordResetTokenRepository = new MongoPasswordResetTokenRepository();
const passwordResetTokenService = new PasswordResetTokenService();
const passwordResetLinkGenerator = new PasswordResetLinkGenerator();

const registerUseCase: IRegisterUseCase = new RegisterUseCase(
  userRepository,
  passwordService,
  otpService,
  otpRepository,
  emailService,
);

const loginUseCase: ILoginUseCase = new LoginUseCase(
  userRepository,
  passwordService,
  tokenService,
);

const logoutUseCase: ILogoutUseCase = new LogoutUseCase(tokenService);

const getProfileUseCase: IGetProfileUseCase = new GetProfileUseCase(
  userRepository,
);

const refreshTokenUseCase: IRefreshTokenUseCase = new RefreshTokenUseCase(
  userRepository,
  tokenService,
);

const forgotPasswordUseCase: IForgotPasswordUseCase = new ForgotPasswordUseCase(
  userRepository,
  passwordResetTokenRepository,
  passwordResetTokenService,
  emailService,
  passwordResetLinkGenerator,
);

const resetPasswordUseCase: IResetPasswordUseCase = new ResetPasswordUseCase(
  userRepository,
  passwordResetTokenRepository,
  passwordService,
  passwordResetTokenService,
);

const verifyOtpUseCase: IVerifyOtpUseCase = new VerifyOtpUseCase(
  userRepository,
  otpRepository,
  otpService,
);

const resendOtpUseCase: IResendOtpUseCase = new ResendOtpUseCase(
  userRepository,
  otpRepository,
  otpService,
  emailService,
);

const googleAuthUseCase: IGoogleAuthUseCase = new GoogleAuthUseCase(
  userRepository,
  tokenService,
);

const changePasswordUseCase: IChangePasswordUseCase = new ChangePasswordUseCase(
  userRepository,
  passwordService,
);

export const authController = new AuthController(
  registerUseCase,
  loginUseCase,
  verifyOtpUseCase,
  resendOtpUseCase,
  forgotPasswordUseCase,
  resetPasswordUseCase,
  googleAuthUseCase,
  refreshTokenUseCase,
  logoutUseCase,
  getProfileUseCase,
  changePasswordUseCase,
);

const authMiddleware = new AuthMiddleware({
  tokenService,
  userRepository,
  clinicRepository,
});

const googleOAuthMiddleware = new GoogleOAuthMiddleware(googleOAuthService);

export const authRouter = createAuthRouter(authController, {
  authenticate: authMiddleware.authenticate,
  googleRedirect: googleOAuthMiddleware.redirect,
  googleAuthenticate: googleOAuthMiddleware.authenticate,
});
