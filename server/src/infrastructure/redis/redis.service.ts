import type { Redis as RedisInstance } from "ioredis";

import type { ICacheService } from "../../application/interfaces/ICacheService.js";
import { redisClient } from "./redis.client.js";
import { logger } from "../logger/logger.js";

export class RedisCacheService implements ICacheService {
  private get client(): RedisInstance {
    return redisClient.getClient();
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);

      if (value === null) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(
        `Redis GET failed for "${key}": ${(error as Error).message}`,
      );

      throw error;
    }
  }

  public async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
    try {
      const serialized = JSON.stringify(value);

      if (ttlSeconds !== undefined) {
        await this.client.set(key, serialized, "EX", ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      logger.error(
        `Redis SET failed for "${key}": ${(error as Error).message}`,
      );

      throw error;
    }
  }

  public async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    try {
      await this.client.del(...keys);
    } catch (error) {
      logger.error(`Redis DEL failed: ${(error as Error).message}`);

      throw error;
    }
  }

  public async delByPattern(pattern: string): Promise<void> {
    try {
      const stream = this.client.scanStream({
        match: pattern,
        count: 100,
      });

      await new Promise<void>((resolve, reject) => {
        stream.on("data", async (keys: string[]) => {
          stream.pause();

          try {
            if (keys.length > 0) {
              const pipeline = this.client.pipeline();

              keys.forEach((key) => pipeline.del(key));

              await pipeline.exec();
            }

            stream.resume();
          } catch (error) {
            reject(error);
          }
        });

        stream.on("end", () => resolve());

        stream.on("error", reject);
      });
    } catch (error) {
      logger.error(
        `Redis pattern delete failed for "${pattern}": ${(error as Error).message}`,
      );

      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      return (await this.client.exists(key)) > 0;
    } catch (error) {
      logger.error(
        `Redis EXISTS failed for "${key}": ${(error as Error).message}`,
      );

      throw error;
    }
  }

  public async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      await this.client.expire(key, ttlSeconds);
    } catch (error) {
      logger.error(
        `Redis EXPIRE failed for "${key}": ${(error as Error).message}`,
      );

      throw error;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error(
        `Redis TTL failed for "${key}": ${(error as Error).message}`,
      );

      throw error;
    }
  }

  public async increment(key: string, by = 1): Promise<number> {
    try {
      return await this.client.incrby(key, by);
    } catch (error) {
      logger.error(
        `Redis INCRBY failed for "${key}": ${(error as Error).message}`,
      );

      throw error;
    }
  }

  public async setNX<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);

      let result: string | null;

      if (ttlSeconds !== undefined) {
        result = await this.client.set(key, serialized, "EX", ttlSeconds, "NX");
      } else {
        result = await this.client.set(key, serialized, "NX");
      }

      return result === "OK";
    } catch (error) {
      logger.error(
        `Redis SETNX failed for "${key}": ${(error as Error).message}`,
      );

      throw error;
    }
  }

  public async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) {
      return [];
    }

    try {
      const values = await this.client.mget(...keys);

      return values.map((value) => {
        if (value === null) {
          return null;
        }

        return JSON.parse(value) as T;
      });
    } catch (error) {
      logger.error(`Redis MGET failed: ${(error as Error).message}`);

      throw error;
    }
  }

  public async flushDatabase(): Promise<void> {
    try {
      await this.client.flushdb();

      logger.warn("Redis database flushed.");
    } catch (error) {
      logger.error(`Redis FLUSHDB failed: ${(error as Error).message}`);

      throw error;
    }
  }
}
