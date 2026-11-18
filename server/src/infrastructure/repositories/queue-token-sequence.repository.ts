import { Types } from "mongoose";
import type { IQueueTokenSequenceRepository } from "@application/interfaces/repositories/IQueueTokenSequenceRepository.ts";
import { QueueSequenceModel } from "@infrastructure/database/mongodb/models/QueueSequenceModel.ts";
import { InternalServerError } from "@shared/errors/index.ts";

export class QueueTokenSequenceRepository implements IQueueTokenSequenceRepository {
  async nextNumber(clinicId: string, localDate: string): Promise<number> {
    const id = `${clinicId}:${localDate}`;
    try {
      const sequence = await QueueSequenceModel.findOneAndUpdate(
        { _id: id },
        { $setOnInsert: { clinicId: new Types.ObjectId(clinicId), localDate }, $inc: { lastTokenNumber: 1 } },
        { upsert: true, returnDocument: "after" },
      ).exec();
      if (sequence) return sequence.lastTokenNumber;
      throw new InternalServerError("Queue token could not be allocated");
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      const sequence = await QueueSequenceModel.findOneAndUpdate({ _id: id }, { $inc: { lastTokenNumber: 1 } }, { returnDocument: "after" }).exec();
      if (!sequence) throw new InternalServerError("Queue token could not be allocated");
      return sequence.lastTokenNumber;
    }
  }
}
