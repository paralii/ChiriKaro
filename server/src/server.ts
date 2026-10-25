import { Server } from "http";
import { app } from "./app.js";
import { logger } from "@infrastructure/logger/logger.ts";
import { MongoDatabase } from "@infrastructure/database/mongodb/mongodb.ts";
import { redisClient } from "@infrastructure/redis/redis.client.ts";

let server: Server;
const mongoDatabase = new MongoDatabase();

const bootstrap = async (): Promise<void> => {
  try {
    await mongoDatabase.connect();
    await redisClient.connect();

    server = app.instance.listen(process.env.PORT, () => {
      logger.info(
        `Server running in ${process.env.NODE_ENV} mode on PORT ${process.env.PORT}`,
      );
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    logger.error(`Failed to bootstrap application: ${message}`);
    process.exit(1);
  }
};

const shutdown = async (signal: string): Promise<void> => {
  logger.warn(`Received ${signal}. Shutting down gracefully...`);

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }

    await mongoDatabase.disconnect();
    await redisClient.disconnect();

    logger.info("Graceful shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error(`Error during shutdown: ${(error as Error).message}`);
    process.exit(1);
  }
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason: unknown) => {
  logger.error(`Unhandled Rejection: ${String(reason)}`);
  process.exit(1);
});

process.on("uncaughtException", (error: Error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

void bootstrap();
