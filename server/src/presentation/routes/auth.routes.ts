import { Router } from "express";
import type { RequestHandler } from "express";

import type { AuthController } from "@presentation/controllers/auth.controller.ts";

export interface AuthRouterMiddlewares {
  authenticate: RequestHandler;
  googleRedirect?: RequestHandler;
  googleAuthenticate?: RequestHandler;
  sensitiveRateLimiter?: RequestHandler;
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
    sensitiveRateLimiter,
  } = middlewares;

  const sensitive: RequestHandler[] = sensitiveRateLimiter
    ? [sensitiveRateLimiter]
    : [];

  //Registration
  router.post("/auth/register", authController.register);
  router.post("/auth/login", authController.login);
  router.post("/auth/refresh-token", authController.refreshToken);
  router.post("/auth/logout", authenticate, authController.logout);

  //Profile
  router.get("/auth/profile", authenticate, authController.getProfile);

  //Email verification (OTP)
  router.post("/auth/verify-otp", authController.verifyOtp);
  router.post("/auth/resend-otp",...sensitive, authController.resendOtp);

  //Password recovery
  router.post(
    "/auth/forgot-password",
    ...sensitive,
    authController.forgotPassword,
  );
  router.post(
    "/auth/reset-password",
    ...sensitive,
    authController.resetPassword,
  );
  router.post(
    "/change-password",
    authenticate,
    authController.changePassword,
  );

  //Google OAuth
  if (googleRedirect) {
    router.get("/google", googleRedirect);
  }

  if (googleAuthenticate) {
    router.get(
      "/google/callback",
      googleAuthenticate,
      authController.googleAuth,
    );
  }

  return router;
}
