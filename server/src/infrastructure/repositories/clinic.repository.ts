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

  async findPage(options: { skip: number; limit: number }): Promise<{
    clinics: Clinic[];
    totalItems: number;
  }> {
    const [docs, totalItems] = await Promise.all([
      this.model
        .find()
        .sort({ createdAt: -1, _id: -1 })
        .skip(options.skip)
        .limit(options.limit)
        .exec(),
      this.model.countDocuments().exec(),
    ]);

    return {
      clinics: docs.map((doc) => this.toDomain(doc)),
      totalItems,
    };
  }

  async save(clinic: Clinic): Promise<Clinic> {
    const data = this.toPersistence(clinic);

    if (!clinic.id) {
      const doc = await this.model.create(data);
      return this.toDomain(doc);
    }

    const doc = await this.model
      .findByIdAndUpdate(
        clinic.id,
        { $set: data },
        { new: true, runValidators: true },
      )
      .exec();

    return this.toDomain(doc!);
  }

  async deleteById(id: string): Promise<void> {
    await super.deleteDocumentById(id);
  }

  private toDomain(doc: IClinicDocument): Clinic {
    return Clinic.fromPersistence({
      _id: doc._id.toString(),
      name: doc.name,
      address: doc.address ?? null,
      city: doc.city ?? null,
      state: doc.state ?? null,
      pincode: doc.pincode ?? null,
      phone: doc.phone ?? null,
      contactEmail: doc.contactEmail ?? null,
      registrationNumber: doc.registrationNumber ?? null,
      ownerAdminId: doc.ownerAdminId ? doc.ownerAdminId.toString() : null,
      status: doc.status,
      specializations: doc.services ?? [],
      workingHours: doc.workingHours ?? [],
      documents: doc.documents ?? [],
      setupStatus: doc.setupStatus,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private toPersistence(clinic: Clinic) {
    return {
      name: clinic.name,
      address: clinic.address ?? null,
      phone: clinic.phone ?? null,
      city: clinic.city ?? null,
      state: clinic.state ?? null,
      pincode: clinic.pincode ?? null,
      contactEmail: clinic.contactEmail ?? null,
      ownerAdminId: clinic.ownerAdminId
        ? new Types.ObjectId(clinic.ownerAdminId)
        : null,
      registrationNumber: clinic.registrationNumber ?? null,
      status: clinic.status,
      services: clinic.specializations,
      workingHours: clinic.workingHours,
      documents: clinic.documents,
      setupStatus: clinic.setupStatus,
    };
  }
}
