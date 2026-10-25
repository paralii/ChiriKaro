import { Types } from "mongoose";
import type { IClinicDocument } from "@infrastructure/database/mongodb/models/ClinicModel.ts";
import { ClinicModel } from "@infrastructure/database/mongodb/models/ClinicModel.ts";
import { BaseRepository } from "@infrastructure/database/mongodb/mongodb.base.repository.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import { Clinic } from "@domain/entities/clinic.entity.ts";

export class ClinicRepository
  extends BaseRepository<IClinicDocument>
  implements IClinicRepository
{
  constructor() {
    super(ClinicModel);
  }

  async findById(id: string): Promise<Clinic | null> {
    const doc = await super.findDocumentById(id);
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(): Promise<Clinic[]> {
    const docs = await this.model.find().exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async save(clinic: Clinic): Promise<Clinic> {
    const doc = await this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(clinic.id) },
        { $set: this.toPersistence(clinic) },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
      .exec();
    return this.toDomain(doc!);
  }

  private toDomain(doc: IClinicDocument): Clinic {
    return Clinic.fromPersistence({
      id: doc._id.toString(),
      name: doc.name,
      address: doc.address ?? null,
      phone: doc.phone ?? null,
      contactEmail: doc.contactEmail ?? null,
      ownerAdminId: doc.ownerAdminId ? doc.ownerAdminId.toString() : null,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private toPersistence(clinic: Clinic) {
    return {
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      contactEmail: clinic.contactEmail,
      ownerAdminId: clinic.ownerAdminId
        ? new Types.ObjectId(clinic.ownerAdminId)
        : null,
      status: clinic.status,
    };
  }
}