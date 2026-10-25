import { BaseRepository } from "@infrastructure/database/mongodb/mongodb.base.repository.ts";
import {
  PasswordResetTokenModel,
} from "@infrastructure/database/mongodb/models/PasswordResetTokenModel.ts";

import type {
  IPasswordResetTokenRepository,
  PasswordResetTokenRecord,
} from "@application/interfaces/repositories/IPasswordResetTokenRepository.js";

import type { IPasswordResetTokenDocument } from "@infrastructure/database/mongodb/models/PasswordResetTokenModel.ts";

export class MongoPasswordResetTokenRepository
  extends BaseRepository<IPasswordResetTokenDocument>
  implements IPasswordResetTokenRepository
{
  constructor() {
    super(PasswordResetTokenModel);
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<PasswordResetTokenRecord | null> {
    const doc = await this.model.findOne({ tokenHash }).exec();

    if (!doc) return null;

    return {
      userId: doc.userId,
      tokenHash: doc.tokenHash,
      expiresAt: doc.expiresAt,
    };
  }

  async save(record: PasswordResetTokenRecord): Promise<void> {
    await this.model.findOneAndUpdate(
      { userId: record.userId },
      {
        $set: {
          userId: record.userId,
          tokenHash: record.tokenHash,
          expiresAt: record.expiresAt,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      },
    ).exec();
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.model.deleteMany({ userId }).exec();
  }
}