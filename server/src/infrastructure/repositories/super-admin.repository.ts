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
import { UserModel } from "@infrastructure/database/mongodb/models/UserModel.ts";
import type { SuperAdminClinicTeamMemberSummary, SuperAdminDoctorSummary } from "@application/interfaces/repositories/ISuperAdminClinicRepository.ts";

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

  async findOwnerName(ownerId: string): Promise<string | null> {
    if (!Types.ObjectId.isValid(ownerId)) return null;
    const owner = await UserModel.findById(ownerId).select("name").lean().exec();
    return owner?.name ?? null;
  }

  async findDoctors(clinicId: string): Promise<SuperAdminDoctorSummary[]> {
    const doctors = await DentistModel.find({ clinicId: new Types.ObjectId(clinicId) })
      .select("firstName lastName professionalTitle verificationStatus specializations")
      .sort({ firstName: 1, lastName: 1 })
      .lean()
      .exec();
    return doctors.map((doctor) => ({
      name: `${doctor.firstName} ${doctor.lastName}`.trim(),
      professionalTitle: doctor.professionalTitle ?? null,
      verificationStatus: doctor.verificationStatus,
      specializations: doctor.specializations ?? [],
    }));
  }

  async findTeamMembers(clinicId: string): Promise<SuperAdminClinicTeamMemberSummary[]> {
    const members = await UserModel.find({
      clinicId: new Types.ObjectId(clinicId),
      role: { $in: ["CLINIC_ADMIN", "STAFF"] },
    }).select("name role status").sort({ role: 1, name: 1 }).lean().exec();
    return members.flatMap((member) =>
      member.role === "CLINIC_ADMIN" || member.role === "STAFF"
        ? [{ name: member.name, role: member.role, status: member.status }]
        : [],
    );
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
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    ).exec();
    return this.toDomain(doc!);
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
    ownerAdminId: doc.ownerAdminId
      ? doc.ownerAdminId.toString()
      : null,
    status: doc.status,
    specializations: doc.services ?? [],

    workingHours: (doc.workingHours ?? []).map((hour) => ({
      day: hour.day,
      isOpen: hour.isOpen,
      startTime: hour.startTime,
      endTime: hour.endTime,
    })),

    documents: (doc.documents ?? []).map((document) => ({
      documentType: document.documentType,
      documentKey: document.documentKey,
      uploadedAt: document.uploadedAt,
    })),

    setupStatus: doc.setupStatus,
    reviewHistory: (doc.reviewHistory ?? []).map((item) => ({ decision: item.decision, reason: item.reason, reviewerId: item.reviewerId?.toString() ?? null, reviewedAt: item.reviewedAt })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
}

  private toPersistence(clinic: Clinic) {
  return {
    name: clinic.name,
    address: clinic.address,
    city: clinic.city,
    state: clinic.state,
    pincode: clinic.pincode,
    phone: clinic.phone,
    contactEmail: clinic.contactEmail,
    registrationNumber: clinic.registrationNumber,
    ownerAdminId: clinic.ownerAdminId
      ? new Types.ObjectId(clinic.ownerAdminId)
      : null,
    services: clinic.specializations,
    workingHours: clinic.workingHours,
    documents: clinic.documents,
    status: clinic.status,
    setupStatus: clinic.setupStatus,
    reviewHistory: clinic.reviewHistory.map((item) => ({ decision: item.decision, reason: item.reason, reviewerId: item.reviewerId ? new Types.ObjectId(item.reviewerId) : null, reviewedAt: item.reviewedAt })),
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
