import type { Request } from "express";
import { ipKeyGenerator } from "express-rate-limit";
import { createRateLimiter } from "../../presentation/middleware/index.js";

const emailAndIpKey = (req: Request): string => {
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.toLowerCase()
      : "unknown";
  return `${ipKeyGenerator(req.ip ?? "")}:${email}`;
};

export const globalApiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
});

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: emailAndIpKey,
});

export const registerRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
});

export const otpVerifyRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyGenerator: emailAndIpKey,
});

export const otpResendRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyGenerator: emailAndIpKey,
});

export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: emailAndIpKey,
});
