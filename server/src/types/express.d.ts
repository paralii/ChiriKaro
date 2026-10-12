import type { TokenPayload } from "../application/interfaces/ITokenService.js";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: TokenPayload;
    }
  }
}

export {};
