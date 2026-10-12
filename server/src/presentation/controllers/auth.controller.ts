import type { CookieOptions, Request, Response, NextFunction } from "express";

import { RegisterUseCase } from "../../application/use-cases/auth/register.use-case.js";
import { LoginUseCase } from "../../application/use-cases/auth/login.use-case.js";
import { LogoutUseCase } from "../../application/use-cases/auth/logout.use-case.js";
import { GetProfileUseCase } from "../../application/use-cases/auth/get-profile.use-case.js";
import { RefreshTokenUseCase } from "../../application/use-cases/auth/refresh-token.use-case.js";
import { ForgotPasswordUseCase } from "../../application/use-cases/auth/forgot-password.use-case.js";
import { ResetPasswordUseCase } from "../../application/use-cases/auth/reset-password.use-case.js";
import { VerifyOtpUseCase } from "../../application/use-cases/auth/verify-otp.use-case.js";
import { ResendOtpUseCase } from "../../application/use-cases/auth/resend-otp.use-case.js";
import { GoogleAuthUseCase } from "../../application/use-cases/auth/google-auth.use-case.js";

import type { RegisterDto } from "../../application/dto/auth/register.dto.js";
import type { LoginDto } from "../../application/dto/auth/login.dto.js";
import type {
  ForgotPasswordDto,
  ResetPasswordDto,
} from "../../application/dto/auth/PasswordResetDto.js";
import type {
  VerifyOtpDto,
  ResendOtpDto,
} from "../../application/dto/auth/OtpDto.js";

import type { GoogleProfile } from "../../application/interfaces/IOAuthService.js";
import { UnauthorizedError } from "../../shared/errors/index.js";

const REFRESH_COOKIE_NAME = "refreshToken";

type GoogleAuthenticatedRequest = Request & { googleProfile?: GoogleProfile };

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
  ) {}

  private readonly cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  };

  private setRefreshCookie(
    res: Response,
    refreshToken: string,
    ttlSeconds: number,
  ): void {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      ...this.cookieOptions,
      maxAge: ttlSeconds * 1000,
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions);
  }

  public register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = req.body as RegisterDto;

      const result = await this.registerUseCase.execute(dto);

      this.setRefreshCookie(
        res,
        result.refreshToken,
        result.refreshTokenTtlSeconds,
      );

      res.status(201).json({
        success: true,
        message: "Registration successful. Please verify your email.",
        data: result.authResponse,
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
      const dto = req.body as LoginDto;

      const result = await this.loginUseCase.execute(dto);

      this.setRefreshCookie(
        res,
        result.refreshToken,
        result.refreshTokenTtlSeconds,
      );

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result.authResponse,
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
      const userId = req.user?.sub;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as
        | string
        | undefined;

      await this.logoutUseCase.execute(userId, refreshToken);

      this.clearRefreshCookie(res);

      res.status(200).json({
        success: true,
        message: "Logout successful",
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
      const userId = req.user?.sub;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const profile = await this.getProfileUseCase.execute(userId);

      res.status(200).json({
        success: true,
        message: "Profile retrieved successfully",
        data: profile,
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
      const incomingToken = req.cookies?.[REFRESH_COOKIE_NAME] as
        | string
        | undefined;

      if (!incomingToken) {
        throw new UnauthorizedError("Refresh token is missing");
      }

      const result = await this.refreshTokenUseCase.execute(incomingToken);

      this.setRefreshCookie(
        res,
        result.refreshToken,
        result.refreshTokenTtlSeconds,
      );

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: { accessToken: result.accessToken },
      });
    } catch (error) {
      this.clearRefreshCookie(res);
      next(error);
    }
  };

  public verifyOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = req.body as VerifyOtpDto;

      await this.verifyOtpUseCase.execute(dto);

      res.status(200).json({
        success: true,
        message: "Email verified successfully",
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
      const dto = req.body as ResendOtpDto;

      await this.resendOtpUseCase.execute(dto);

      res.status(200).json({
        success: true,
        message: "A new verification code has been sent to your email",
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
      const dto = req.body as ForgotPasswordDto;

      await this.forgotPasswordUseCase.execute(dto);

      res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
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
      const dto = req.body as ResetPasswordDto;

      await this.resetPasswordUseCase.execute(dto);

      this.clearRefreshCookie(res);

      res.status(200).json({
        success: true,
        message: "Password reset successful. Please log in with your new password.",
      });
    } catch (error) {
      next(error);
    }
  };

  public googleCallback = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const profile = (req as GoogleAuthenticatedRequest).googleProfile;

      if (!profile) {
        throw new UnauthorizedError("Google authentication failed");
      }

      const result = await this.googleAuthUseCase.execute(profile);

      this.setRefreshCookie(
        res,
        result.refreshToken,
        result.refreshTokenTtlSeconds,
      );

      res.status(200).json({
        success: true,
        message: "Google login successful",
        data: result.authResponse,
      });
    } catch (error) {
      next(error);
    }
  };
}