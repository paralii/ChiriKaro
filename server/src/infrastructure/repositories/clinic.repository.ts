import { Types } from "mongoose";
import type { IClinicDocument } from "@infrastructure/database/mongodb/models/ClinicModel.ts";
import { ClinicModel } from "@infrastructure/database/mongodb/models/ClinicModel.ts";
import { BaseRepository } from "@infrastructure/database/mongodb/mongodb.base.repository.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import { Clinic } from "@domain/entities/clinic.entity.ts";

const CLINIC_WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function normalizePersistedWorkingHours(value: unknown) {
  const rows = Array.isArray(value) ? value as Array<Record<string, unknown>> : [];
  return CLINIC_WEEK_DAYS.map((day, index) => {
    const row = rows.find((item) => {
      const storedDay = item?.day ?? item?.weekday;
      return typeof storedDay === "string" && storedDay.trim().toUpperCase() === day.toUpperCase();
    }) ?? rows[index];
    const startTime = row?.startTime ?? row?.start ?? row?.openingTime;
    const endTime = row?.endTime ?? row?.end ?? row?.closingTime;
    return {
      day,
      isOpen: typeof row?.isOpen === "boolean" ? row.isOpen : typeof row?.open === "boolean" ? row.open : false,
      startTime: typeof startTime === "string" ? startTime : "09:00",
      endTime: typeof endTime === "string" ? endTime : "17:00",
    };
  });
}

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
        { returnDocument: "after", runValidators: true },
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
      clinicType: doc.clinicType ?? null,
      description: doc.description ?? null,
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
      workingHours: normalizePersistedWorkingHours(doc.workingHours),
      timeZone: doc.timeZone ?? "Asia/Kolkata",
      documents: doc.documents ?? [],
      setupStatus: doc.setupStatus,
      reviewHistory: (doc.reviewHistory ?? []).map((item) => ({ decision: item.decision, reason: item.reason, reviewerId: item.reviewerId?.toString() ?? null, reviewedAt: item.reviewedAt })),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private toPersistence(clinic: Clinic) {
    return {
      name: clinic.name,
      clinicType: clinic.clinicType,
      description: clinic.description,
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
      timeZone: clinic.timeZone,
      documents: clinic.documents,
      setupStatus: clinic.setupStatus,
      reviewHistory: clinic.reviewHistory.map((item) => ({ decision: item.decision, reason: item.reason, reviewerId: item.reviewerId ? new Types.ObjectId(item.reviewerId) : null, reviewedAt: item.reviewedAt })),
    };
  }
}
