import { Types } from "mongoose";
import type { IClinic } from "@infrastructure/database/mongodb/models/ClinicModel.js";
import { ClinicModel } from "@infrastructure/database/mongodb/models/ClinicModel.js";
import { BaseRepository } from "@infrastructure/database/mongodb/mongodb.base.repository.js";
import type { IClinicRepository } from "../../domain/repositories/IClinicRepository.js";
import { Clinic } from "../../domain/entities/clinic.entity.js";

export class ClinicRepository
  extends BaseRepository<IClinic>
  implements IClinicRepository
{
  constructor() {
    super(ClinicModel);
  }

  async findById(id: string): Promise<Clinic | null> {
    const doc = await this.model.findById(id).exec();
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

  private toDomain(doc: IClinic): Clinic {
    return Clinic.fromPersistence({
      id: doc._id.toString(),
      name: doc.name,
      address: doc.address ?? null,
      phone: doc.phone ?? null,
      ownerName: doc.ownerName ?? null,
      contactEmail: doc.contactEmail ?? null,
      ownerAdminId: doc.ownerAdminId ? doc.ownerAdminId.toString() : null,
      status: doc.status,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private toPersistence(clinic: Clinic) {
    return {
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      ownerName: clinic.ownerName,
      contactEmail: clinic.contactEmail,
      ownerAdminId: clinic.ownerAdminId
        ? new Types.ObjectId(clinic.ownerAdminId)
        : null,
      status: clinic.status,
      isActive: clinic.isActive,
    };
  }
}