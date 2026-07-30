import { env } from "@infrastructure/config/env.js";

export interface AppConfig {
  nodeName: string;
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  clientUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
}

export const appConfig: AppConfig = {
  nodeName: env.NODE_NAME,
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  clientUrl: env.CLIENT_URL,
  isProduction: env.NODE_ENV === "production",
  isDevelopment: env.NODE_ENV === "development",
};
