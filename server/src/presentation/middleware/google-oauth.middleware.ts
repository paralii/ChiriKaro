import type { Request, Response, NextFunction } from "express";

import type { IOAuthService } from "@application/interfaces/services/IOAuthService.ts";

import { UnauthorizedError } from "@shared/errors/index.ts";

export class GoogleOAuthMiddleware {
  constructor(private readonly _googleOAuthService: IOAuthService) {}

  public redirect = (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    try {
      const state = crypto.randomUUID();

      res.cookie("google_oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 5 * 60 * 1000,
      });

      res.redirect(this._googleOAuthService.getAuthUrl(state));
    } catch (error) {
      next(error);
    }
  };

  public authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { code, state } = req.query;
      const storedState = req.cookies?.google_oauth_state;

      res.clearCookie("google_oauth_state");

      if (
        typeof code !== "string" ||
        typeof state !== "string" ||
        !storedState ||
        state !== storedState
      ) {
        throw new UnauthorizedError("Invalid Google OAuth callback");
      }
      const profile = await this._googleOAuthService.getProfileFromCode(code);

      req.googleProfile = profile;

      next();
    } catch (error) {
      next(error);
    }
  };
}
