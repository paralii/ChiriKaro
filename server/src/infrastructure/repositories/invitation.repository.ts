import { Types } from "mongoose";
import type { IInvitationDocument } from "@infrastructure/database/mongodb/models/InvitationModel.js";
import { InvitationModel } from "@infrastructure/database/mongodb/models/InvitationModel.js";
import { BaseRepository } from "@infrastructure/database/mongodb/mongodb.base.repository.js";
import type { IInvitationRepository } from "@application/interfaces/repositories/IInvitationRepository.ts";
import { Invitation } from "@domain/entities/Invitation.entity.js";
import {  InvitationStatus } from "@domain/enum/invitation-status.enum.ts";

export class InvitationRepository
  extends BaseRepository<IInvitationDocument>
  implements IInvitationRepository
{
  constructor() {
    super(InvitationModel);
  }

  async findPendingByEmail(email: string): Promise<Invitation | null> {
    const doc = await this.model
      .findOne({
        email: email.toLowerCase(),
        status: InvitationStatus.PENDING,
        expiresAt: { $gt: new Date() },
      })
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
      .exec();
    return this.toDomain(doc!);
  }

  private toDomain(doc: IInvitationDocument): Invitation {
    return Invitation.fromPersistence({
      id: doc._id.toString(),
      email: doc.email,
      role: doc.role,
      clinicId: doc.clinicId.toString(),
      invitedBy: doc.invitedBy.toString(),
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
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    };
  }
}