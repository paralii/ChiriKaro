import { Types } from "mongoose";
import type { IClinicDocument } from "@infrastructure/database/mongodb/models/ClinicModel.ts";
import { ClinicModel } from "@infrastructure/database/mongodb/models/ClinicModel.ts";
import { DentistModel } from "@infrastructure/database/mongodb/models/DentistModel.ts";
import { BaseRepository } from "@infrastructure/database/mongodb/mongodb.base.repository.ts";
import type { ISuperAdminClinicRepository, SuperAdminPatientSummary, SuperAdminDoctorSummary, SuperAdminDoctorDetails } from "@application/interfaces/repositories/ISuperAdminClinicRepository.ts";
import type { ISuperAdminStatisticsRepository } from "@application/interfaces/repositories/ISuperAdminStatisticsRepository.ts";
import type { SuperAdminStatisticsDTO } from "@application/dto/super-admin/statistics.dto.ts";
import { Clinic } from "@domain/entities/clinic.entity.ts";
import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";
import type { DoctorVerificationStatus } from "@domain/entities/doctor.entity.ts";
import { UserModel } from "@infrastructure/database/mongodb/models/UserModel.ts";
import type { SuperAdminClinicTeamMemberSummary } from "@application/interfaces/repositories/ISuperAdminClinicRepository.ts";

interface CountByStatus {
  _id: string;
  count: number;
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
      .select("userId clinicId firstName lastName professionalTitle verificationStatus specializations consultationFee")
      .sort({ firstName: 1, lastName: 1 })
      .lean()
      .exec();
    const [users, clinic] = await Promise.all([
      UserModel.find({ _id: { $in: doctors.map((doctor) => doctor.userId) }, role: "DOCTOR" }).select("email").lean().exec(),
      ClinicModel.findById(clinicId).select("name").lean().exec(),
    ]);
    const emails = new Map(users.map((user) => [user._id.toString(), user.email]));
    return doctors.map((doctor) => ({
      id: doctor._id.toString(), name: `${doctor.firstName} ${doctor.lastName}`.trim(),
      email: emails.get(doctor.userId.toString()) ?? null, clinicName: clinic?.name ?? null,
      professionalTitle: doctor.professionalTitle ?? null,
      verificationStatus: doctor.verificationStatus,
      specializations: doctor.specializations ?? [],
      consultationFee: doctor.consultationFee ?? null,
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

  async findPage(options: { skip: number; limit: number; search?: string; status?: ClinicStatus }): Promise<{ clinics: Clinic[]; totalItems: number }> {
    const query: Record<string, unknown> = {};
    if (options.status) query.status = options.status;
    if (options.search) {
      const pattern = new RegExp(escapeRegex(options.search), "i");
      query.$or = [{ name: pattern }, { contactEmail: pattern }, { address: pattern }, { city: pattern }];
    }
    const [docs, totalItems] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1, _id: -1 }).skip(options.skip).limit(options.limit).exec(),
      this.model.countDocuments(query).exec(),
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

  async findPatientsPage(options: { skip: number; limit: number; search?: string; status?: "ACTIVE" | "SUSPENDED" }): Promise<{ patients: SuperAdminPatientSummary[]; totalItems: number }> {
    const query: Record<string, unknown> = { role: "PATIENT" };
    if (options.status) query.status = options.status;
    if (options.search) {
      const pattern = new RegExp(escapeRegex(options.search), "i");
      query.$or = [{ name: pattern }, { email: pattern }];
    }
    const [patients, totalItems] = await Promise.all([
      UserModel.find(query).select("name email status createdAt").sort({ createdAt: -1, _id: -1 }).skip(options.skip).limit(options.limit).lean().exec(),
      UserModel.countDocuments(query).exec(),
    ]);
    return {
      patients: patients.map((patient) => ({ id: patient._id.toString(), name: patient.name, email: patient.email, status: patient.status, createdAt: patient.createdAt })),
      totalItems,
    };
  }

  async findPatientById(patientId: string): Promise<(SuperAdminPatientSummary & { updatedAt: Date; avatar: string | null }) | null> {
    const patient = await UserModel.findOne({ _id: new Types.ObjectId(patientId), role: "PATIENT" })
      .select("name email status createdAt updatedAt avatar").lean().exec();
    return patient ? { id: patient._id.toString(), name: patient.name, email: patient.email, status: patient.status, createdAt: patient.createdAt, updatedAt: patient.updatedAt, avatar: patient.avatar ?? null } : null;
  }

  async updatePatientStatus(patientId: string, status: "ACTIVE" | "SUSPENDED"): Promise<SuperAdminPatientSummary | null> {
    const patient = await UserModel.findOneAndUpdate(
      { _id: new Types.ObjectId(patientId), role: "PATIENT" },
      { $set: { status } },
      { returnDocument: "after", runValidators: true },
    ).select("name email status createdAt").lean().exec();
    return patient ? { id: patient._id.toString(), name: patient.name, email: patient.email, status: patient.status, createdAt: patient.createdAt } : null;
  }

  async findDoctorsPage(options: { skip: number; limit: number; search?: string; status?: DoctorVerificationStatus }): Promise<{ doctors: SuperAdminDoctorSummary[]; totalItems: number }> {
    const query: Record<string, unknown> = {};
    if (options.status) query.verificationStatus = options.status;
    if (options.search) {
      const pattern = new RegExp(escapeRegex(options.search), "i");
      const [users, clinics] = await Promise.all([
        UserModel.find({ role: "DOCTOR", email: pattern }).select("_id").lean().exec(),
        ClinicModel.find({ name: pattern }).select("_id").lean().exec(),
      ]);
      query.$or = [
        { firstName: pattern }, { lastName: pattern }, { professionalTitle: pattern },
        { registrationNumber: pattern }, { specializations: pattern },
        ...(users.length ? [{ userId: { $in: users.map((user) => user._id) } }] : []),
        ...(clinics.length ? [{ clinicId: { $in: clinics.map((clinic) => clinic._id) } }] : []),
      ];
    }
    const [profiles, totalItems] = await Promise.all([
      DentistModel.find(query).select("userId clinicId firstName lastName professionalTitle verificationStatus specializations consultationFee")
        .sort({ firstName: 1, lastName: 1, _id: 1 }).skip(options.skip).limit(options.limit).lean().exec(),
      DentistModel.countDocuments(query).exec(),
    ]);
    const userIds = profiles.map((profile) => profile.userId);
    const clinicIds = profiles.map((profile) => profile.clinicId);
    const [users, clinics] = await Promise.all([
      UserModel.find({ _id: { $in: userIds } }).select("email role").lean().exec(),
      ClinicModel.find({ _id: { $in: clinicIds } }).select("name").lean().exec(),
    ]);
    const emails = new Map(users.filter((user) => user.role === "DOCTOR").map((user) => [user._id.toString(), user.email]));
    const clinicNames = new Map(clinics.map((clinic) => [clinic._id.toString(), clinic.name]));
    return {
      doctors: profiles.map((profile) => ({
        id: profile._id.toString(), name: `${profile.firstName} ${profile.lastName}`.trim(),
        email: emails.get(profile.userId.toString()) ?? null, clinicName: clinicNames.get(profile.clinicId.toString()) ?? null,
        professionalTitle: profile.professionalTitle ?? null, verificationStatus: profile.verificationStatus,
        specializations: profile.specializations ?? [], consultationFee: profile.consultationFee ?? null,
      })),
      totalItems,
    };
  }

  async findDoctorDetails(doctorId: string): Promise<SuperAdminDoctorDetails | null> {
    const profile = await DentistModel.findById(doctorId)
      .select("userId clinicId firstName lastName professionalTitle qualifications yearsOfExperience registrationNumber registrationAuthority verificationStatus rejectionReason specializations procedures consultationFee workingHours documents createdAt updatedAt")
      .lean().exec();
    if (!profile) return null;
    const [user, clinic] = await Promise.all([
      UserModel.findOne({ _id: profile.userId, role: "DOCTOR" }).select("email").lean().exec(),
      ClinicModel.findById(profile.clinicId).select("name").lean().exec(),
    ]);
    return {
      id: profile._id.toString(), name: `${profile.firstName} ${profile.lastName}`.trim(),
      email: user?.email ?? null, clinicName: clinic?.name ?? null,
      professionalTitle: profile.professionalTitle ?? null,
      qualifications: profile.qualifications ?? [], yearsOfExperience: profile.yearsOfExperience ?? null,
      registrationNumber: profile.registrationNumber ?? null, registrationAuthority: profile.registrationAuthority ?? null,
      verificationStatus: profile.verificationStatus, rejectionReason: profile.rejectionReason ?? null,
      specializations: profile.specializations ?? [], procedures: profile.procedures ?? [], consultationFee: profile.consultationFee ?? null,
      workingHours: (profile.workingHours ?? []).map((hour) => ({ day: hour.day, isOpen: hour.isOpen, startTime: hour.startTime, endTime: hour.endTime })),
      documents: (profile.documents ?? []).map((document) => ({ documentType: document.documentType, status: document.status, uploadedAt: document.uploadedAt, rejectionReason: document.rejectionReason ?? null })),
      createdAt: profile.createdAt, updatedAt: profile.updatedAt,
    };
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
    ownerAdminId: doc.ownerAdminId
      ? doc.ownerAdminId.toString()
      : null,
    status: doc.status,
    specializations: doc.services ?? [],
    timeZone: doc.timeZone ?? "Asia/Kolkata",

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
