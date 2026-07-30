import { env } from "@infrastructure/config/env.js";

export interface DatabaseConfig {
  uri: string;
}

export const databaseConfig: DatabaseConfig = {
  uri: env.MONGO_URI,
};
