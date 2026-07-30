import mongoose from "mongoose";
import { databaseConfig } from "./database.config.js";
import { logger } from "@infrastructure/logger/logger.js";

export class MongoDatabase {
  private static instance: MongoDatabase;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): MongoDatabase {
    if (!MongoDatabase.instance) {
      MongoDatabase.instance = new MongoDatabase();
    }
    return MongoDatabase.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info("MongoDB is already connected");
      return;
    }

    try {
      mongoose.set("strictQuery", true);

      await mongoose.connect(databaseConfig.uri);

      this.isConnected = true;
      logger.info("MongoDB connected successfully");

      mongoose.connection.on("error", (error: Error) => {
        logger.error(`MongoDB connection error: ${error.message}`);
      });

      mongoose.connection.on("disconnected", () => {
        this.isConnected = false;
        logger.warn("MongoDB disconnected");
      });
    } catch (error) {
      const err = error as Error;
      logger.error(`MongoDB connection failed: ${err.message}`);
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info("MongoDB disconnected gracefully");
    } catch (error) {
      const err = error as Error;
      logger.error(`Error disconnecting MongoDB: ${err.message}`);
      throw err;
    }
  }

  public getConnectionState(): boolean {
    return this.isConnected;
  }
}

export const mongoDatabase = MongoDatabase.getInstance();
