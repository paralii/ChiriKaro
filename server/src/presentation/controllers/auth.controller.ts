import type { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";
import { UnauthorizedError } from "@shared/errors/index.ts";

import type { IRegisterUseCase } from "@application/interfaces/use-cases/auth/IRegisterUseCase.ts";
import type { ILoginUseCase } from "@application/interfaces/use-cases/auth/ILoginUseCase.ts";
import type { IVerifyOtpUseCase } from "@application/interfaces/use-cases/auth/IVerifyOtpUseCase.ts";
import type { IResendOtpUseCase } from "@application/interfaces/use-cases/auth/IResendOtpUseCase.ts";
import type { IForgotPasswordUseCase } from "@application/interfaces/use-cases/auth/IForgotPasswordUseCase.ts";
import type { IResetPasswordUseCase } from "@application/interfaces/use-cases/auth/IResetPasswordUseCase.ts";
import type { IGoogleAuthUseCase } from "@application/interfaces/use-cases/auth/IGoogleAuthUseCase.ts";
import type { IRefreshTokenUseCase } from "@application/interfaces/use-cases/auth/IRefreshTokenUseCase.ts";
import type { ILogoutUseCase } from "@application/interfaces/use-cases/auth/ILogoutUseCase.ts";
import type { IGetProfileUseCase } from "@application/interfaces/use-cases/auth/IGetProfileUseCase.ts";
import type { IChangePasswordUseCase } from "@application/interfaces/use-cases/auth/IChangePasswordUseCase.ts";

import { AuthCookieHelper } from "@presentation/helper/auth-cookie.helper.ts";

export class AuthController {
  constructor(
    private readonly _registerUseCase: IRegisterUseCase,
    private readonly _loginUseCase: ILoginUseCase,
    private readonly _verifyOtpUseCase: IVerifyOtpUseCase,
    private readonly _resendOtpUseCase: IResendOtpUseCase,
    private readonly _forgotPasswordUseCase: IForgotPasswordUseCase,
    private readonly _resetPasswordUseCase: IResetPasswordUseCase,
    private readonly _googleAuthUseCase: IGoogleAuthUseCase,
    private readonly _refreshTokenUseCase: IRefreshTokenUseCase,
    private readonly _logoutUseCase: ILogoutUseCase,
    private readonly _getProfileUseCase: IGetProfileUseCase,
    private readonly _changePasswordUseCase: IChangePasswordUseCase,
  ) {}

  public register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this._registerUseCase.execute(req.body);

      ApiResponse.created(res, "User registered", result.user);
    } catch (error) {
      next(error);
    }
  };

  public login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this._loginUseCase.execute(req.body);

      AuthCookieHelper.setAuthCookies(
        res,
        result.accessToken,
        result.refreshToken,
      );

      ApiResponse.success(res, "User Logined", result.user);
    } catch (error) {
      next(error);
    }
  };

  public logout = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this._logoutUseCase.execute({
        refreshToken: req.cookies?.refreshToken,
      });

      AuthCookieHelper.clearAuthCookies(res);

      ApiResponse.success(res, "Logged out successfully");
    } catch (error) {
      next(error);
    }
  };

  public getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this._getProfileUseCase.execute(req.user!.sub);

      ApiResponse.success(res, "User data fetched", result);
    } catch (error) {
      next(error);
    }
  };

  public refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this._refreshTokenUseCase.execute(
        req.cookies?.refreshToken,
      );

      AuthCookieHelper.setAuthCookies(
        res,
        result.accessToken,
        result.refreshToken,
      );

      ApiResponse.success(res, "Token refreshed successfully");
    } catch (error) {
      next(error);
    }
  };

  public forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this._forgotPasswordUseCase.execute(req.body);

      ApiResponse.success(
        res,
        "If the account exists, password reset instructions will be sent.",
      );
    } catch (error) {
      next(error);
    }
  };

  public resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this._resetPasswordUseCase.execute(req.body);

      ApiResponse.success(res, "Password reset successfully");
    } catch (error) {
      next(error);
    }
  };

  public verifyOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this._verifyOtpUseCase.execute(req.body);

      ApiResponse.success(res, "Otp verified", result);
    } catch (error) {
      next(error);
    }
  };

  public resendOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this._resendOtpUseCase.execute(req.body);

      ApiResponse.success(
        res,
        "If applicable, a verification code will be sent.",
      );
    } catch (error) {
      next(error);
    }
  };

  public googleAuth = async (
    req: Request,
    res: Response,
    _reqNext: NextFunction,
  ): Promise<void> => {
    void _reqNext;
    try {
      if (!req.googleProfile) {
        throw new UnauthorizedError("Google authentication failed");
      }
      if (
        req.googleAuthIntent === "signup" &&
        !req.googleProfile.emailVerified
      ) {
        throw new UnauthorizedError("Google email must be verified");
      }
      const result = await this._googleAuthUseCase.execute(
        req.googleProfile,
        req.googleAuthIntent,
      );

      AuthCookieHelper.setAuthCookies(
        res,
        result.accessToken,
        result.refreshToken,
      );

      res.redirect(
        `${process.env.CLIENT_URL ?? "http://localhost:2026"}/auth/google/callback?success=1`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Google sign-in failed";
      if (message === "Google authentication failed") {
        AuthCookieHelper.clearAuthCookies(res);
      }
      res.redirect(
        `${process.env.CLIENT_URL ?? "http://localhost:2026"}/auth/google/callback?error=${encodeURIComponent(message)}`,
      );
    }
  };

  public changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this._changePasswordUseCase.execute({
        ...req.body,
        userId: req.user!.sub,
      });

      ApiResponse.success(res, "Password changed successfully");
    } catch (error) {
      next(error);
    }
  };
}
