import { Types } from "mongoose";
import type { IClinicDocument } from "@infrastructure/database/mongodb/models/ClinicModel.ts";
import { ClinicModel } from "@infrastructure/database/mongodb/models/ClinicModel.ts";
import { DentistModel } from "@infrastructure/database/mongodb/models/DentistModel.ts";
import { BaseRepository } from "@infrastructure/database/mongodb/mongodb.base.repository.ts";
import type { ISuperAdminClinicRepository } from "@application/interfaces/repositories/ISuperAdminClinicRepository.ts";
import type { ISuperAdminStatisticsRepository } from "@application/interfaces/repositories/ISuperAdminStatisticsRepository.ts";
import type { SuperAdminStatisticsDTO } from "@application/dto/super-admin/statistics.dto.ts";
import { Clinic } from "@domain/entities/clinic.entity.ts";
import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";

interface CountByStatus {
  _id: string;
  count: number;
}

export class SuperAdminClinicRepository extends BaseRepository<IClinicDocument> implements ISuperAdminClinicRepository {
  constructor() { super(ClinicModel); }

  async findById(id: string): Promise<Clinic | null> {
    const doc = await super.findDocumentById(id);
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(): Promise<Clinic[]> {
    return (await this.model.find().exec()).map((doc) => this.toDomain(doc));
  }

  async findPage(options: { skip: number; limit: number }): Promise<{ clinics: Clinic[]; totalItems: number }> {
    const [docs, totalItems] = await Promise.all([
      this.model.find().sort({ createdAt: -1, _id: -1 }).skip(options.skip).limit(options.limit).exec(),
      this.model.countDocuments().exec(),
    ]);
    return { clinics: docs.map((doc) => this.toDomain(doc)), totalItems };
  }

  async save(clinic: Clinic): Promise<Clinic> {
    if (!clinic.id) {
      throw new Error("Clinic id is required to save a clinic");
    }

    const doc = await this.model.findOneAndUpdate(
      { _id: new Types.ObjectId(clinic.id) },
      { $set: this.toPersistence(clinic) },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    return this.toDomain(doc!);
  }

  private toDomain(doc: IClinicDocument): Clinic {
    return Clinic.fromPersistence({
      _id: doc._id.toString(),
      name: doc.name,
      address: doc.address ?? null,
      phone: doc.phone ?? null,
      contactEmail: doc.contactEmail ?? null,
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
      address: clinic.address,
      phone: clinic.phone,
      contactEmail: clinic.contactEmail,
      ownerAdminId: clinic.ownerAdminId ? new Types.ObjectId(clinic.ownerAdminId) : null,
      status: clinic.status,
    };
  }
}

export class SuperAdminStatisticsRepository implements ISuperAdminStatisticsRepository {
  async getStatistics(): Promise<SuperAdminStatisticsDTO> {
    const [clinicCounts, doctorCounts] = await Promise.all([
      ClinicModel.aggregate<CountByStatus>([{ $group: { _id: "$status", count: { $sum: 1 } } }]).exec(),
      DentistModel.aggregate<CountByStatus>([{ $group: { _id: "$verificationStatus", count: { $sum: 1 } } }]).exec(),
    ]);
    const clinics = this.toCountMap(clinicCounts);
    const doctors = this.toCountMap(doctorCounts);
    const verified = doctors.VERIFIED ?? 0;
    const pendingVerification = doctors.PENDING_VERIFICATION ?? 0;
    const rejected = doctors.REJECTED ?? 0;
    return {
      clinics: {
        total: Object.values(clinics).reduce((total, count) => total + count, 0),
        approved: clinics[ClinicStatus.APPROVED] ?? 0,
        pending: clinics[ClinicStatus.PENDING] ?? 0,
        blocked: clinics[ClinicStatus.BLOCKED] ?? 0,
      },
      doctors: {
        total: Object.values(doctors).reduce((total, count) => total + count, 0),
        verified,
        pendingVerification,
        rejected,
        verificationOverview: {
          notStarted: doctors.NOT_STARTED ?? 0,
          inProgress: doctors.IN_PROGRESS ?? 0,
          pendingVerification,
          verified,
          rejected,
        },
      },
    };
  }

  private toCountMap(counts: CountByStatus[]): Record<string, number> {
    return Object.fromEntries(counts.map(({ _id, count }) => [_id, count]));
  }
}
