import { Redis } from "ioredis";
import type { Redis as RedisInstance } from "ioredis";

import { redisConfig } from "./redis.config.js";
import { logger } from "../logger/logger.js";

class RedisClient {
  private client: RedisInstance | null = null;

  public async connect(): Promise<RedisInstance> {
    if (this.client && this.client.status === "ready") {
      return this.client;
    }

    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }

      this.client = null;
    }

    const client = new Redis(redisConfig.url, {
      lazyConnect: true,

      maxRetriesPerRequest: 3,

      enableReadyCheck: true,

      retryStrategy(times) {
        return Math.min(times * 200, 3000);
      },
    });

    client.on("connect", () => {
      logger.info("Redis client connected");
    });

    client.on("ready", () => {
      logger.info("Redis client ready");
    });

    client.on("close", () => {
      logger.warn("Redis connection closed");
    });

    client.on("reconnecting", () => {
      logger.info("Redis reconnecting...");
    });

    client.on("end", () => {
      logger.warn("Redis connection ended");
    });

    client.on("error", (error: Error) => {
      logger.error(`Redis error: ${error.message}`);
    });

    try {
      await client.connect();
      await client.ping();

      this.client = client;

      return client;
    } catch (error) {
      client.disconnect();

      logger.error(`Failed to connect to Redis: ${(error as Error).message}`);

      throw error;
    }
  }

  public getClient(): RedisInstance {
    if (!this.client || this.client.status !== "ready") {
      throw new Error(
        "Redis client is not connected. Call connect() during application startup.",
      );
    }

    return this.client;
  }

  public async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    } finally {
      this.client = null;
      logger.info("Redis client disconnected");
    }
  }

  public isConnected(): boolean {
    return this.client?.status === "ready";
  }
}

export const redisClient = new RedisClient();
