import type { Redis as RedisInstance } from "ioredis";

import type {
  IOtpRepository,
  OtpChallenge,
} from "@application/interfaces/repositories/IOtpRepository.ts";

import { redisClient } from "@infrastructure/redis/redis.client.ts";
import { logger } from "@infrastructure/logger/logger.js";

export class RedisService implements IOtpRepository {
  private readonly keyPrefix = "otp:";

  constructor(
    private readonly getRedis: () => RedisInstance = () =>
      redisClient.getClient(),
  ) {}

  public async save(
    key: string,
    challenge: OtpChallenge,
    ttlSeconds: number,
  ): Promise<void> {
    if (ttlSeconds <= 0) {
      throw new Error("OTP TTL must be greater than zero.");
    }

    try {
      await this.getRedis().set(
        this.buildKey(key),
        JSON.stringify(challenge),
        "EX",
        ttlSeconds,
      );

      logger.info("OTP challenge saved successfully", {
        ttlSeconds,
      });
    } catch (error) {
      logger.error("Failed to save OTP challenge", {
        error: this.getErrorMessage(error),
      });

      throw error;
    }
  }

  public async findByKey(key: string): Promise<OtpChallenge | null> {
    try {
      const value = await this.getRedis().get(this.buildKey(key));

      if (value === null) {
        logger.info("OTP challenge not found or expired");
        return null;
      }

      const parsed: unknown = JSON.parse(value);

      if (!this.isOtpChallenge(parsed)) {
        logger.error("Invalid OTP challenge structure in Redis");
        throw new Error("Invalid OTP challenge stored in Redis.");
      }

      logger.info("OTP challenge retrieved successfully");

      return {
        ...parsed,
        expiresAt: new Date(parsed.expiresAt),
      };
    } catch (error) {
      logger.error("Failed to retrieve OTP challenge", {
        error: this.getErrorMessage(error),
      });

      throw error;
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      const deleted = await this.getRedis().del(this.buildKey(key));

      if (deleted > 0) {
        logger.info("OTP challenge deleted successfully");
      } else {
        logger.warn("OTP challenge not found during deletion");
      }
    } catch (error) {
      logger.error("Failed to delete OTP challenge", {
        error: this.getErrorMessage(error),
      });

      throw error;
    }
  }

  private buildKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  private isOtpChallenge(value: unknown): value is OtpChallenge {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    const challenge = value as Record<string, unknown>;

    return (
      typeof challenge.codeHash === "string" &&
      typeof challenge.expiresAt === "string" &&
      Number.isInteger(challenge.attempts) &&
      (challenge.attempts as number) >= 0 &&
      !Number.isNaN(Date.parse(challenge.expiresAt))
    );
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
