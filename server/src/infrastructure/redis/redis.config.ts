import { env } from "@infrastructure/config/env.js";

export interface RedisConfig {
  url: string;
}

export const redisConfig: RedisConfig = {
  url: env.REDIS_URL,
};
