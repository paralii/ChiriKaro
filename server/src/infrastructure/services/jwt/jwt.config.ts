import { env } from "@infrastructure/config/env.js";
import type { StringValue } from "ms";

export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: StringValue;
  refreshExpiresIn: StringValue;
}

export const jwtConfig: JwtConfig = {
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN as StringValue,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN as StringValue,
};
