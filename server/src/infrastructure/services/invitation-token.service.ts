import { createHash, randomBytes } from "node:crypto";
import type {
  GeneratedInvitationToken,
  IInvitationTokenService,
} from "@application/interfaces/services/IInvitationTokenService.ts";

export class InvitationTokenService implements IInvitationTokenService {
  generate(): GeneratedInvitationToken {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    return { token, tokenHash };
  }
}
