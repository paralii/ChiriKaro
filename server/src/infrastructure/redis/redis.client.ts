import { Redis } from "ioredis";
import type { Redis as RedisInstance } from "ioredis";

import { redisConfig } from "@infrastructure/redis/redis.config.js";
import { logger } from "@infrastructure/logger/logger.js";

class RedisClient {
private client: RedisInstance | null = null;
private connectionPromise: Promise<RedisInstance> | null = null;

public async connect(): Promise<RedisInstance> {
if (this.client?.status === "ready") {
return this.client;
}

if (this.connectionPromise) {
  return this.connectionPromise;
}

const client = new Redis(redisConfig.url, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,

  retryStrategy(times: number): number {
    return Math.min(times * 200, 3000);
  },
});

this.registerListeners(client);

this.connectionPromise = this.initialize(client);

try {
  return await this.connectionPromise;
} finally {
  this.connectionPromise = null;
}

}

private async initialize(
client: RedisInstance,
): Promise<RedisInstance> {
try {
await client.connect();
await client.ping();

  this.client = client;

  return client;
} catch (error) {
  client.disconnect();

  logger.error(
    `Failed to connect to Redis: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );

  throw error;
}

}

private registerListeners(client: RedisInstance): void {
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
const client = this.client;

if (!client) {
  return;
}

try {
  if (client.status !== "end") {
    await client.quit();
  }
} catch {
  client.disconnect();
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
