import mongoose from "mongoose";
import { databaseConfig } from "@infrastructure/database/mongodb/database.config.ts";
import { logger } from "@infrastructure/logger/logger.js";
import { AppointmentModel } from "@infrastructure/database/mongodb/models/AppointmentModel.ts";
import { AppointmentDayAllocationModel } from "@infrastructure/database/mongodb/models/AppointmentDayAllocationModel.ts";
import { AppointmentPaymentModel } from "@infrastructure/database/mongodb/models/AppointmentPaymentModel.ts";
import { QueueEntryModel } from "@infrastructure/database/mongodb/models/QueueEntryModel.ts";
import { QueueSequenceModel } from "@infrastructure/database/mongodb/models/QueueSequenceModel.ts";
import { SettlementModel } from "@infrastructure/database/mongodb/models/SettlementModel.ts";

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
      await Promise.all([AppointmentModel.init(), AppointmentDayAllocationModel.init(), AppointmentPaymentModel.init(), QueueEntryModel.init(), QueueSequenceModel.init(), SettlementModel.init()]);
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
