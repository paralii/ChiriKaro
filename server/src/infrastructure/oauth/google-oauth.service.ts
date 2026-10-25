import { OAuth2Client } from "google-auth-library";

import { UnauthorizedError } from "@shared/errors/index.js";

import { googleOAuthConfig } from "@infrastructure/oauth/google-oauth.config.ts";

import type {IOAuthService, OAuthProfile } from "@application/interfaces/services/IOAuthService.ts";

const GOOGLE_SCOPES = ["openid", "email", "profile"];

export class GoogleOAuthService implements IOAuthService {
  private readonly client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(
      googleOAuthConfig.clientId,
      googleOAuthConfig.clientSecret,
      googleOAuthConfig.callbackUrl,
    );
  }

  public getAuthUrl(state: string): string {
    return this.client.generateAuthUrl({
      scope: GOOGLE_SCOPES,
      state,
      response_type: "code",
    });
  }

  public async getProfileFromCode(code: string): Promise<OAuthProfile> {
    try {
      const { tokens } = await this.client.getToken({
        code,
        redirect_uri: googleOAuthConfig.callbackUrl
      });

    if (!tokens.id_token) {
      throw new UnauthorizedError(
        "Google authentication failed: missing id token",
      );
    }

    const ticket = await this.client.verifyIdToken({
      idToken: tokens.id_token,
      audience: googleOAuthConfig.clientId,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email || payload.email_verified !== true) {
      throw new UnauthorizedError(
        "Google authentication failed: invalid profile payload",
      );
    }

    return {
        googleId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified,
        name: payload.name?.trim() || payload.email.split("@")[0]!,
        avatar: payload.picture ?? null,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }

      throw new UnauthorizedError("Google authentication failed");
    }
  }
}
