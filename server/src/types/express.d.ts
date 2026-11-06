import type { TokenPayload } from "@application/interfaces/services/ITokenService.ts";
import type { OAuthProfile } from "@application/interfaces/services/IOAuthService.ts";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: TokenPayload;
      googleProfile?: OAuthProfile;
    }
  }
}

export {};