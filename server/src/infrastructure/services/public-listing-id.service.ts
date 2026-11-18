import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@infrastructure/config/env.ts";
import { BadRequestError } from "@shared/errors/index.ts";
import type { IPublicListingIdService, PublicListingClaims } from "@application/interfaces/services/IPublicListingIdService.ts";

const VERSION = "v1";
const KEY = createHash("sha256").update(env.JWT_ACCESS_SECRET).digest();

export class PublicListingIdService implements IPublicListingIdService {
  create(claims: PublicListingClaims): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", KEY, iv);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(claims), "utf8"),
      cipher.final(),
    ]);
    return [VERSION, iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".");
  }

  read(value: string): PublicListingClaims {
    try {
      if (value.length > 512) throw new Error("Invalid handle");
      const [version, ivPart, tagPart, ciphertextPart, extra] = value.split(".");
      if (version !== VERSION || !ivPart || !tagPart || !ciphertextPart || extra !== undefined) throw new Error("Invalid handle");
      const iv = Buffer.from(ivPart, "base64url");
      const tag = Buffer.from(tagPart, "base64url");
      const ciphertext = Buffer.from(ciphertextPart, "base64url");
      if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0) throw new Error("Invalid handle");
      const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
      decipher.setAuthTag(tag);
      const parsed: unknown = JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8"));
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid handle");
      const claims = parsed as Record<string, unknown>;
      if (typeof claims.clinicId !== "string" || typeof claims.doctorUserId !== "string" ||
        !/^[a-f\d]{24}$/i.test(claims.clinicId) || !/^[a-f\d]{24}$/i.test(claims.doctorUserId)) throw new Error("Invalid handle");
      return { clinicId: claims.clinicId, doctorUserId: claims.doctorUserId };
    } catch {
      throw new BadRequestError("Directory listing handle is invalid");
    }
  }
}
