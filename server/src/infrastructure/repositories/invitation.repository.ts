import { Types } from "mongoose";
import type { IInvitation } from "@infrastructure/database/mongodb/models/InvitationModel.js";
import { InvitationModel } from "@infrastructure/database/mongodb/models/InvitationModel.js";
import { BaseRepository } from "@infrastructure/database/mongodb/mongodb.base.repository.js";
import type { IInvitationRepository } from "../../domain/repositories/IInvitationRepository.js";
import {
  Invitation,
  InvitationStatus,
} from "../../domain/entities/Invitation.entity.js";

export class InvitationRepository
  extends BaseRepository<IInvitation>
  implements IInvitationRepository
{
  constructor() {
    super(InvitationModel);
  }

  /** token is select:false on the schema, so re-select it explicitly here. */
  async findByToken(token: string): Promise<Invitation | null> {
    const doc = await this.model.findOne({ token }).select("+token").exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findPendingByEmail(email: string): Promise<Invitation | null> {
    const doc = await this.model
      .findOne({
        email: email.toLowerCase(),
        status: InvitationStatus.PENDING,
        expiresAt: { $gt: new Date() },
      })
      .select("+token")
      .exec();
    return doc ? this.toDomain(doc) : null;
  }

  async save(invitation: Invitation): Promise<Invitation> {
    const doc = await this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(invitation.id) },
        { $set: this.toPersistence(invitation) },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
      .select("+token")
      .exec();
    return this.toDomain(doc!);
  }

  private toDomain(doc: IInvitation): Invitation {
    return Invitation.fromPersistence({
      id: doc._id.toString(),
      email: doc.email,
      role: doc.role,
      clinicId: doc.clinicId.toString(),
      invitedBy: doc.invitedBy.toString(),
      token: doc.token,
      status: doc.status,
      expiresAt: doc.expiresAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private toPersistence(invitation: Invitation) {
    return {
      email: invitation.email,
      role: invitation.role,
      clinicId: new Types.ObjectId(invitation.clinicId as string),
      invitedBy: new Types.ObjectId(invitation.invitedBy),
      token: invitation.token,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    };
  }
}