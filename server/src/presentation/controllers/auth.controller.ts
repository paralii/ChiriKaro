import type { Request, Response, NextFunction } from "express";

import { RegisterUseCase } from "@application/use-cases/auth/register.use-case.ts";
import { LoginUseCase } from "@application/use-cases/auth/login.use-case.ts";
import { LogoutUseCase } from "@application/use-cases/auth/logout.use-case.ts";
import { GetProfileUseCase } from "@application/use-cases/auth/get-profile.use-case.ts";
import { RefreshTokenUseCase } from "@application/use-cases/auth/refresh-token.use-case.ts";
import { ForgotPasswordUseCase } from "@application/use-cases/auth/forgot-password.use-case.ts";
import { ResetPasswordUseCase } from "@application/use-cases/auth/reset-password.use-case.ts";
import { VerifyOtpUseCase } from "@application/use-cases/auth/verify-otp.use-case.ts";
import { ResendOtpUseCase } from "@application/use-cases/auth/resend-otp.use-case.ts";
import { GoogleAuthUseCase } from "@application/use-cases/auth/google-auth.use-case.ts";
import { ChangePasswordUseCase } from "@application/use-cases/auth/change-password.use-case.ts";

import { AuthCookieHelper } from "@presentation/helper/auth-cookie.helper.ts";

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly verifyOtpUseCase: VerifyOtpUseCase,
    private readonly resendOtpUseCase: ResendOtpUseCase,
    private readonly googleAuthUseCase: GoogleAuthUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  public register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.registerUseCase.execute(req.body);

      res.status(200).json({
        success: true,
        data: result.user,
      });
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
      const result = await this.loginUseCase.execute(req.body);

      AuthCookieHelper.setAuthCookies(
        res,
        result.accessToken,
        result.refreshToken,
      );

      res.status(200).json({
        success: true,
        data: result.user,
      });
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
      await this.logoutUseCase.execute({
        refreshToken: req.cookies?.refreshToken,
      });

      AuthCookieHelper.clearAuthCookies(res);

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
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
      const result = await this.getProfileUseCase.execute(
        res.locals.auth.userId,
      );

      res.status(200).json({
        success: true,
        data: result,
      });
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
      const result = await this.refreshTokenUseCase.execute(
        req.cookies?.refreshToken,
      );

      AuthCookieHelper.setAuthCookies(
        res,
        result.accessToken,
        result.refreshToken,
      );

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
      });
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
      await this.forgotPasswordUseCase.execute(req.body);

      res.status(200).json({
        success: true,
        message:
          "If the account exists, password reset instructions will be sent.",
      });
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
      await this.resetPasswordUseCase.execute(req.body);

      res.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
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
      const result = await this.verifyOtpUseCase.execute(req.body);

      res.status(200).json({
        success: true,
        data: result,
      });
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
      await this.resendOtpUseCase.execute(req.body);

      res.status(200).json({
        success: true,
        message: "If applicable, a verification code will be sent.",
      });
    } catch (error) {
      next(error);
    }
  };

  public googleAuth = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.googleAuthUseCase.execute(req.body);

      AuthCookieHelper.setAuthCookies(
        res,
        result.accessToken,
        result.refreshToken,
      );

      res.status(200).json({
        success: true,
        data: result.user,
      });
    } catch (error) {
      next(error);
    }
  };

  public changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.changePasswordUseCase.execute({
        ...req.body,
        userId: res.locals.auth.userId,
      });

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
