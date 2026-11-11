import { Router } from "express";
import type { RequestHandler } from "express";
import { API_ROUTES } from "@shared/constants/apiRoutes.ts";

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

  router.post(
    API_ROUTES.AUTH.REGISTER,
    ...(registerRateLimiter ? [registerRateLimiter] : []),
    authController.register,
  );
  router.post(
    API_ROUTES.AUTH.LOGIN,
    ...(loginRateLimiter ? [loginRateLimiter] : []),
    authController.login,
  );
  router.post(API_ROUTES.AUTH.REFRESH_TOKEN, authController.refreshToken);
  router.post(API_ROUTES.AUTH.LOGOUT, authenticate, authController.logout);

  router.get(API_ROUTES.AUTH.PROFILE, authenticate, authController.getProfile);

  router.post(
    API_ROUTES.AUTH.VERIFY_OTP,
    ...(otpVerifyRateLimiter ? [otpVerifyRateLimiter] : []),
    authController.verifyOtp,
  );
  router.post(
    API_ROUTES.AUTH.RESEND_OTP,
    ...(otpResendRateLimiter ? [otpResendRateLimiter] : []),
    authController.resendOtp,
  );

  router.post(
    API_ROUTES.AUTH.FORGOT_PASSWORD,
    ...(passwordResetRateLimiter ? [passwordResetRateLimiter] : []),
    authController.forgotPassword,
  );
  router.post(
    API_ROUTES.AUTH.RESET_PASSWORD,
    ...(passwordResetRateLimiter ? [passwordResetRateLimiter] : []),
    authController.resetPassword,
  );
  router.post(
    API_ROUTES.AUTH.CHANGE_PASSWORD,
    authenticate,
    authController.changePassword,
  );

  if (googleRedirect) {
    router.get(API_ROUTES.AUTH.GOOGLE, googleRedirect);
  }

  if (googleAuthenticate) {
    router.get(
      API_ROUTES.AUTH.GOOGLE_CALLBACK,
      googleAuthenticate,
      authController.googleAuth,
    );
  }

  return router;
}
