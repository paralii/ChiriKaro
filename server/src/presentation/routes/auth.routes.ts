import { Router } from "express";
import type { RequestHandler } from "express";

import type { AuthController } from "@presentation/controllers/auth.controller.ts";

export interface AuthRouterMiddlewares {
  authenticate: RequestHandler;
  googleRedirect?: RequestHandler;
  googleAuthenticate?: RequestHandler;
  registerRateLimiter?: RequestHandler;
  loginRateLimiter?: RequestHandler;
  otpVerifyRateLimiter?: RequestHandler;
  otpResendRateLimiter?: RequestHandler;
  passwordResetRateLimiter?: RequestHandler;
}

export function createAuthRouter(
  authController: AuthController,
  middlewares: AuthRouterMiddlewares,
): Router {
  const router = Router();

  const {
    authenticate,
    googleRedirect,
    googleAuthenticate,
    registerRateLimiter,
    loginRateLimiter,
    otpVerifyRateLimiter,
    otpResendRateLimiter,
    passwordResetRateLimiter,
  } = middlewares;

  //Registration
  router.post(
    "/auth/register",
    ...(registerRateLimiter ? [registerRateLimiter] : []),
    authController.register,
  );
  router.post(
    "/auth/login",
    ...(loginRateLimiter ? [loginRateLimiter] : []),
    authController.login,
  );
  router.post("/auth/refresh-token", authController.refreshToken);
  router.post("/auth/logout", authenticate, authController.logout);

  //Profile
  router.get("/auth/profile", authenticate, authController.getProfile);

  //Email verification (OTP)
  router.post(
    "/auth/verify-otp",
    ...(otpVerifyRateLimiter ? [otpVerifyRateLimiter] : []),
    authController.verifyOtp,
  );
  router.post(
    "/auth/resend-otp",
    ...(otpResendRateLimiter ? [otpResendRateLimiter] : []),
    authController.resendOtp,
  );

  //Password recovery
  router.post(
    "/auth/forgot-password",
    ...(passwordResetRateLimiter ? [passwordResetRateLimiter] : []),
    authController.forgotPassword,
  );
  router.post(
    "/auth/reset-password",
    ...(passwordResetRateLimiter ? [passwordResetRateLimiter] : []),
    authController.resetPassword,
  );
  router.post(
    "/auth/change-password",
    authenticate,
    authController.changePassword,
  );

  if (googleRedirect) {
    router.get("/auth/google", googleRedirect);
  }

  if (googleAuthenticate) {
    router.get(
      "/auth/google/callback",
      googleAuthenticate,
      authController.googleAuth,
    );
  }

  return router;
}
