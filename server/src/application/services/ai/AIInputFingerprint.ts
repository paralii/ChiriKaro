import { createHash } from "node:crypto";

/** Hashes only the normalized, feature-allowlisted input sent to a provider. */
export class AIInputFingerprint {
  create(feature: string, normalizedInput: unknown): string {
    return createHash("sha256").update(JSON.stringify({ feature, normalizedInput })).digest("hex");
  }
}
