import type { Request, Response, NextFunction } from "express";

import type { IOAuthService } from "@application/interfaces/services/IOAuthService.ts";

import { UnauthorizedError } from "@shared/errors/index.ts";

export class GoogleOAuthMiddleware {
  constructor(private readonly _googleOAuthService: IOAuthService) {}

  public redirect = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const state = crypto.randomUUID();

      res.cookie("google_oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 5 * 60 * 1000,
      });

      res.cookie(
        "google_oauth_intent",
        req.query.intent === "signup" ? "signup" : "signin",
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 5 * 60 * 1000,
        },
      );

      const authUrl = new URL(this._googleOAuthService.getAuthUrl(state));
      const requestedIntent =
        req.query.intent === "signup" ? "signup" : "signin";
      authUrl.searchParams.set("state", `${state}.${requestedIntent}`);
      res.redirect(authUrl.toString());
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
      const intent = req.cookies?.google_oauth_intent;

      res.clearCookie("google_oauth_state");
      res.clearCookie("google_oauth_intent");

      if (
        typeof code !== "string" ||
        typeof state !== "string" ||
        !storedState ||
        (state !== storedState &&
          state !== `${storedState}.signup` &&
          state !== `${storedState}.signin`) ||
        (intent !== "signup" && intent !== "signin")
      ) {
        throw new UnauthorizedError("Invalid Google OAuth callback");
      }
      const stateIntent = state.endsWith(".signup") ? "signup" : "signin";
      if (stateIntent !== intent)
        throw new UnauthorizedError("Invalid Google OAuth callback");
      const profile = await this._googleOAuthService.getProfileFromCode(code);

      req.googleProfile = profile;
      req.googleAuthIntent = intent;

      next();
    } catch (error) {
      next(error);
    }
  };
}
