import { Types } from "mongoose";
import type { IInvitationDocument } from "@infrastructure/database/mongodb/models/InvitationModel.js";
import { InvitationModel } from "@infrastructure/database/mongodb/models/InvitationModel.js";
import { BaseRepository } from "@infrastructure/database/mongodb/mongodb.base.repository.js";
import type { IInvitationRepository } from "@application/interfaces/repositories/IInvitationRepository.ts";
import { Invitation } from "@domain/entities/Invitation.entity.js";
import { InvitationStatus } from "@domain/enum/invitation-status.enum.ts";

export class InvitationRepository
  extends BaseRepository<IInvitationDocument>
  implements IInvitationRepository
{
  constructor() {
    super(InvitationModel);
  }

  async findPendingByEmail(email: string, clinicId: string): Promise<Invitation | null> {
    const doc = await this.model
      .findOne({
        email: email.toLowerCase(),
        clinicId: new Types.ObjectId(clinicId),
        status: InvitationStatus.PENDING,
        expiresAt: { $gt: new Date() },
      })
      .select("+tokenHash")
      .exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findPendingById(id: string, clinicId: string): Promise<Invitation | null> {
    const doc = await this.model
      .findOne({
        _id: new Types.ObjectId(id),
        clinicId: new Types.ObjectId(clinicId),
        status: InvitationStatus.PENDING,
        expiresAt: { $gt: new Date() },
      })
      .select("+tokenHash")
      .exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findPendingByClinic(clinicId: string): Promise<Invitation[]> {
    const docs = await this.model
      .find({
        clinicId: new Types.ObjectId(clinicId),
        status: InvitationStatus.PENDING,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 })
      .select("+tokenHash")
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByTokenHash(tokenHash: string): Promise<Invitation | null> {
    const doc = await this.model
      .findOne({ tokenHash })
      .select("+tokenHash")
      .exec();
    return doc ? this.toDomain(doc) : null;
  }

  async markAcceptedIfPending(id: string, tokenHash: string): Promise<boolean> {
    const result = await this.model
      .updateOne(
        {
          _id: new Types.ObjectId(id),
          tokenHash,
          status: InvitationStatus.PENDING,
          expiresAt: { $gt: new Date() },
        },
        { $set: { status: InvitationStatus.ACCEPTED } },
      )
      .exec();
    return result.modifiedCount === 1;
  }

  async save(invitation: Invitation): Promise<Invitation> {
    if (!invitation.id) {
      const doc = await this.model.create(this.toPersistence(invitation));
      return this.toDomain(doc);
    }

    const doc = await this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(invitation.id) },
        { $set: this.toPersistence(invitation) },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .select("+tokenHash")
      .exec();
    return this.toDomain(doc!);
  }

  async deleteById(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  private toDomain(doc: IInvitationDocument): Invitation {
    return Invitation.fromPersistence({
      id: doc._id.toString(),
      email: doc.email,
      tokenHash: doc.tokenHash,
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
      tokenHash: invitation.tokenHash,
      role: invitation.role,
      clinicId: new Types.ObjectId(invitation.clinicId as string),
      invitedBy: new Types.ObjectId(invitation.invitedBy),
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    };
  }
}
