import fs from "fs";
import path from "path";
import winston from "winston";
import { loggerConfig } from "./logger.config.js";

const LOG_DIR = path.join(process.cwd(), "logs");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const developmentFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaString =
      Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `[${ts}] ${level}: ${stack ?? message}${metaString}`;
  }),
);

const productionFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger: winston.Logger = winston.createLogger({
  level: loggerConfig.level,
  format: loggerConfig.isProduction ? productionFormat : developmentFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(LOG_DIR, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, "combined.log"),
    }),
  ],
  exitOnError: false,
});
