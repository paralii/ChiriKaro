import { Server } from "http";
import { app } from "./app.js";
// import { routes } from "./presentation/routes";
import { appConfig } from "./infrastructure/config/index.js";
import { logger } from "./infrastructure/logger/logger.js";
import { mongoDatabase } from "./infrastructure/database/mongodb/index.js";
import { redisClient } from "./infrastructure/redis/redis.client.js";

let server: Server;

const bootstrap = async (): Promise<void> => {
  try {
    await mongoDatabase.connect();
    await redisClient.connect();

    // app.registerRoutes(routes);
    app.registerErrorHandlers();

    server = app.instance.listen(appConfig.port, () => {
      logger.info(
        `Server running in ${appConfig.nodeEnv} mode on port ${appConfig.port}`,
      );
    });
  } catch (error) {
    logger.error(
      `Failed to bootstrap application: ${(error as Error).message}`,
    );
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
