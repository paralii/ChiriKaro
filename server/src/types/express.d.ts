import type { TokenPayload } from "@application/interfaces/services/ITokenService.ts";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: TokenPayload;
    }
  }
}

export {};
