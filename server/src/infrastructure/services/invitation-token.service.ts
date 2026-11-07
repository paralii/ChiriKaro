import { createHash, randomBytes } from "node:crypto";
import type {
  GeneratedInvitationToken,
  IInvitationTokenService,
} from "@application/interfaces/services/IInvitationTokenService.ts";

export class InvitationTokenService implements IInvitationTokenService {
  generate(): GeneratedInvitationToken {
    const token = randomBytes(32).toString("hex");
    const tokenHash = this.hash(token);
    return { token, tokenHash };
  }

  hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
