import dotenv from "dotenv";
import path from "path";
import Joi from "joi";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

interface EnvVars {
  NODE_NAME: string;
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  API_PREFIX: string;

  MONGO_URI: string;

  REDIS_URL: string;

  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;

  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;

  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  SMTP_FROM_NAME: string;
  SMTP_FROM_EMAIL: string;

  CLIENT_URL: string;

  LOG_LEVEL: string;
}

const envSchema = Joi.object({
  NODE_NAME: Joi.string(),
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().port().default(5000),
  API_PREFIX: Joi.string().default("/api/v1"),

  MONGO_URI: Joi.string().uri().required(),

  REDIS_URL: Joi.string().uri().required(),

  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),

  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().required(),

  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().port().required(),
  SMTP_USER: Joi.string().required(),
  SMTP_PASSWORD: Joi.string().required(),
  SMTP_FROM_NAME: Joi.string().default("ChiriKaro"),
  SMTP_FROM_EMAIL: Joi.string().email().required(),

  CLIENT_URL: Joi.string().uri().required(),

  LOG_LEVEL: Joi.string()
    .valid("error", "warn", "info", "http", "verbose", "debug", "silly")
    .default("info"),
}).unknown(true);

const { error, value } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

export const env: EnvVars = {
  NODE_NAME: value.NODE_NAME,
  NODE_ENV: value.NODE_ENV,
  PORT: value.PORT,
  API_PREFIX: value.API_PREFIX,

  MONGO_URI: value.MONGO_URI,

  REDIS_URL: value.REDIS_URL,

  JWT_ACCESS_SECRET: value.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: value.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: value.JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: value.JWT_REFRESH_EXPIRES_IN,

  GOOGLE_CLIENT_ID: value.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: value.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: value.GOOGLE_CALLBACK_URL,

  SMTP_HOST: value.SMTP_HOST,
  SMTP_PORT: value.SMTP_PORT,
  SMTP_USER: value.SMTP_USER,
  SMTP_PASSWORD: value.SMTP_PASSWORD,
  SMTP_FROM_NAME: value.SMTP_FROM_NAME,
  SMTP_FROM_EMAIL: value.SMTP_FROM_EMAIL,

  CLIENT_URL: value.CLIENT_URL,

  LOG_LEVEL: value.LOG_LEVEL,
};
