import { Router } from "express";
import type { RequestHandler } from "express";

import type { AuthController } from "../controllers/auth.controller.js";

export interface AuthRouterMiddlewares {
  authenticate: RequestHandler;
  googleRedirect: RequestHandler;
  googleAuthenticate: RequestHandler;
  sensitiveRateLimiter?: RequestHandler;
}

export function AuthRouter(
  authController: AuthController,
  middlewares: AuthRouterMiddlewares,
): Router {
  const router = Router();

  const { authenticate, googleRedirect, googleAuthenticate } = middlewares;
  const sensitive: RequestHandler[] = middlewares.sensitiveRateLimiter
    ? [middlewares.sensitiveRateLimiter]
    : [];

  //Registration
  router.post("/auth/register", authController.register);
  router.post("/auth/login", authController.login);
  router.post("/auth/refresh-token", authController.refreshToken);
  router.post("/auth/logout", authenticate, authController.logout);

  //Profile
  router.get("/auth/profile", authenticate, authController.getProfile);

  //Email verification (OTP)
  router.post("/auth/verify-otp", ...sensitive, authController.verifyOtp);
  router.post("/auth/resend-otp", ...sensitive, authController.resendOtp);

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

  //Google OAuth
  router.get("/auth/google", googleRedirect);
  router.get(
    "/auth/google/callback",
    googleAuthenticate,
    authController.googleAuth,
  );

  return router;
}
