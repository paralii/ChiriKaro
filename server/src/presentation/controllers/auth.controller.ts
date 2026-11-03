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

      res
        .status(HttpStatus.OK)
        .json(ApiResponse.success("User registered", result.user));
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

      res
        .status(HttpStatus.OK)
        .json(ApiResponse.success("User Logined", result.user));
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

      res
        .status(HttpStatus.OK)
        .json(ApiResponse.success("Logged out successfully"));
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

      res.status(HttpStatus.OK).json(ApiResponse.success("", result));
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

      res
        .status(HttpStatus.OK)
        .json(ApiResponse.success("Token refreshed successfully"));
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

      res
        .status(HttpStatus.OK)
        .json(
          ApiResponse.success(
            "If the account exists, password reset instructions will be sent.",
          ),
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

      res
        .status(HttpStatus.OK)
        .json(ApiResponse.success("Password reset successfully"));
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

      res
        .status(HttpStatus.OK)
        .json(ApiResponse.success("Otp verified", result));
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

      res
        .status(HttpStatus.OK)
        .json(
          ApiResponse.success(
            "If applicable, a verification code will be sent.",
          ),
        );
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
      const result = await this._googleAuthUseCase.execute(req.body);

      AuthCookieHelper.setAuthCookies(
        res,
        result.accessToken,
        result.refreshToken,
      );

      res
        .status(HttpStatus.OK)
        .json(ApiResponse.success("google user authorized", result.user));
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
      await this._changePasswordUseCase.execute({
        ...req.body,
        userId: req.user!.sub,
      });

      res
        .status(HttpStatus.OK)
        .json(ApiResponse.success("Password changed successfully"));
    } catch (error) {
      next(error);
    }
  };
}
