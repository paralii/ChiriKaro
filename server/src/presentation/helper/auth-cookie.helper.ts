import type { Response } from "express";

const ACCESS_TOKEN_COOKIE = "accessToken";

const REFRESH_TOKEN_COOKIE = "refreshToken";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
};

export class AuthCookieHelper {
  static setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/auth/refresh",
    });
  }

  static clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, {
      ...cookieOptions,
    });

    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      ...cookieOptions,
      path: "/auth/refresh",
    });
  }
}