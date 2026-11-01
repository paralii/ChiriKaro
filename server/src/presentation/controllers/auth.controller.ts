import type { Request, Response, NextFunction } from "express";
import { HttpStatus } from "@shared/enums/http-status.enum.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";

import type { IRegisterUseCase } from "@application/interfaces/use-cases/auth/IRegisterUseCase.ts";
import type { ILoginUseCase } from "@application/interfaces/use-cases/auth/ILoginUseCase.ts";
import type { IVerifyOtpUseCase } from "@application/interfaces/use-cases/auth/IVerifyOtpUseCase.ts";
import type { IResendOtpUseCase } from "@application/interfaces/use-cases/auth/IResendOtpUseCase.ts";
import type { IForgotPasswordUseCase } from "@application/interfaces/use-cases/auth/IForgotPasswordUseCase.ts";
import type { IResetPasswordUseCase } from "@application/interfaces/use-cases/auth/IResetPasswordUseCase.ts";
import type { IGoogleAuthUseCase } from "@application/interfaces/use-cases/auth/IGoogleAuthUseCase.ts";
import type { IRefreshTokenUseCase } from "@application/interfaces/use-cases/auth/IRefreshTokenUseCase.ts";
import type { ILogoutUseCase } from "@application/interfaces/use-cases/auth/ILogoutUseCase.ts";

import { GetProfileUseCase } from "@application/use-cases/auth/get-profile.use-case.ts";
import { ChangePasswordUseCase } from "@application/use-cases/auth/change-password.use-case.ts";

import { AuthCookieHelper } from "@presentation/helper/auth-cookie.helper.ts";

export class AuthController {
  constructor(
    private readonly registerUseCase: IRegisterUseCase,
    private readonly loginUseCase: ILoginUseCase,
    private readonly verifyOtpUseCase: IVerifyOtpUseCase,
    private readonly resendOtpUseCase: IResendOtpUseCase,
    private readonly forgotPasswordUseCase: IForgotPasswordUseCase,
    private readonly resetPasswordUseCase: IResetPasswordUseCase,
    private readonly googleAuthUseCase: IGoogleAuthUseCase,
    private readonly refreshTokenUseCase: IRefreshTokenUseCase,
    private readonly logoutUseCase: ILogoutUseCase,

    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  public register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.registerUseCase.execute(req.body);

      res.status(HttpStatus.OK).json(ApiResponse.success(
        "User registered",
          result.user
      ));
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

      res.status(HttpStatus.OK).json(ApiResponse.success("User Logined",
        result.user
      ));
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

      res.status(HttpStatus.OK).json(ApiResponse.success("Logged out successfully"));
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

      res.status(HttpStatus.OK).json(ApiResponse.success('',result));
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

      res.status(HttpStatus.OK).json(ApiResponse.success("Token refreshed successfully"));
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

      res.status(HttpStatus.OK).json(ApiResponse.success("If the account exists, password reset instructions will be sent."));
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

      res.status(HttpStatus.OK).json(ApiResponse.success("Password reset successfully"));
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

      res.status(HttpStatus.OK).json(ApiResponse.success("Otp verified", result));
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

      res.status(HttpStatus.OK).json(ApiResponse.success("If applicable, a verification code will be sent."));
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

      res.status(HttpStatus.OK).json(ApiResponse.success('google user authorized',result.user));
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

      res.status(HttpStatus.OK).json(ApiResponse.success("Password changed successfully"));
    } catch (error) {
      next(error);
    }
  };
}
