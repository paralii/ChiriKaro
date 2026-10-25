import mongoose from "mongoose";
import { databaseConfig } from "@infrastructure/database/mongodb/database.config.ts";
import { logger } from "@infrastructure/logger/logger.js";

export class MongoDatabase {
  private isConnecting = false;

  public async connect(): Promise<void> {
    if (mongoose.connection.readyState === 1) {
      logger.info("MongoDB is already connected");
      return;
    }

    if (this.isConnecting) {
      await mongoose.connection.asPromise();
      return;
    }

    this.isConnecting = true;

    try {
      mongoose.set("strictQuery", true);

      await mongoose.connect(databaseConfig.uri);
      logger.info("MongoDB connected successfully");
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`MongoDB connection failed: ${err.message}`);
      throw err;
    } finally {
      this.isConnecting = false;
    }
  }

  public async disconnect(): Promise<void> {
    if (mongoose.connection.readyState === 0) {
      return;
    }

    try {
      await mongoose.disconnect();

      logger.info("MongoDB disconnected gracefully");
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Error disconnecting MongoDB: ${err.message}`);
      throw err;
    }
  }

  public getConnectionState(): boolean {
    return mongoose.connection.readyState === 1;
  }
}
