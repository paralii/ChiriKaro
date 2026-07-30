import { OAuth2Client } from "google-auth-library";
import type { TokenPayload } from "google-auth-library";
import { googleOAuthConfig } from "./google-oauth.config.js";
import type {
  IOAuthService,
  GoogleProfile,
} from "../../application/interfaces/IOAuthService.js";
import { UnauthorizedError } from "../../shared/errors/index.js";

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

  public getAuthUrl(): string {
    return this.client.generateAuthUrl({
      access_type: "offline",
      scope: GOOGLE_SCOPES,
      prompt: "consent",
    });
  }

  public async getProfileFromCode(code: string): Promise<GoogleProfile> {
    const { tokens } = await this.client.getToken(code);

    if (!tokens.id_token) {
      throw new UnauthorizedError(
        "Google authentication failed: missing id token",
      );
    }

    const ticket = await this.client.verifyIdToken({
      idToken: tokens.id_token,
      audience: googleOAuthConfig.clientId,
    });

    const payload: TokenPayload | undefined = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email) {
      throw new UnauthorizedError(
        "Google authentication failed: invalid profile payload",
      );
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email.split("@")[0] ?? "",
      avatar: payload.picture ?? 'image',
    };
  }
}
