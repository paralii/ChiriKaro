import { Types } from "mongoose";
import { DentistModel } from "@infrastructure/database/mongodb/models/DentistModel.ts";
import type { IDentistProfile } from "@infrastructure/database/mongodb/models/DentistModel.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import { Doctor } from "@domain/entities/doctor.entity.ts";
import { InternalServerError } from "@shared/errors/index.ts";
import type { DoctorVerificationStatus } from "@domain/entities/doctor.entity.ts";

export class DoctorRepository implements IDoctorRepository {
  async findByUserId(userId: string): Promise<Doctor | null> {
    const document = await DentistModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    return document ? this.toDomain(document) : null;
  }

  async findByUserIdAndClinic(userId: string, clinicId: string): Promise<Doctor | null> {
    const document = await DentistModel.findOne({ userId: new Types.ObjectId(userId), clinicId: new Types.ObjectId(clinicId) }).exec();
    return document ? this.toDomain(document) : null;
  }

  async findByIdAndClinic(doctorId: string, clinicId: string): Promise<Doctor | null> {
    const document = await DentistModel.findOne({
      _id: new Types.ObjectId(doctorId),
      clinicId: new Types.ObjectId(clinicId),
    }).exec();
    return document ? this.toDomain(document) : null;
  }

  async findByClinicAndStatus(clinicId: string, status: DoctorVerificationStatus): Promise<Doctor[]> {
    const documents = await DentistModel.find({
      clinicId: new Types.ObjectId(clinicId),
      verificationStatus: status,
    }).sort({ updatedAt: 1, _id: 1 }).exec();
    return documents.map((document) => this.toDomain(document));
  }

  async findByClinic(clinicId: string): Promise<Doctor[]> {
    const documents = await DentistModel.find({ clinicId: new Types.ObjectId(clinicId) }).sort({ createdAt: -1 }).exec();
    return documents.map((document) => this.toDomain(document));
  }

  async save(doctor: Doctor): Promise<Doctor> {
    const document = await DentistModel.findOneAndUpdate(
      { userId: new Types.ObjectId(doctor.userId) },
      { $set: this.toPersistence(doctor) },
      { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).exec();
    if (!document) throw new InternalServerError("Doctor onboarding could not be saved");
    return this.toDomain(document);
  }

  private toDomain(document: IDentistProfile): Doctor {
    return Doctor.fromPersistence({
      id: document._id.toString(),
      userId: document.userId.toString(),
      clinicId: document.clinicId.toString(),
      firstName: document.firstName,
      lastName: document.lastName,
      gender: document.gender ?? null,
      dateOfBirth: document.dateOfBirth ?? null,
      professionalTitle: document.professionalTitle ?? null,
      qualifications: document.qualifications ?? [],
      yearsOfExperience: document.yearsOfExperience ?? null,
      registrationNumber: document.registrationNumber ?? null,
      registrationAuthority: document.registrationAuthority ?? null,
      specializations: document.specializations ?? [],
      procedures: document.procedures ?? [],
      workingHours: (document.workingHours ?? []).map((hours) => ({
        day: hours.day,
        isOpen: hours.isOpen,
        startTime: hours.startTime,
        endTime: hours.endTime,
      })),
      breaks: (document.breaks ?? []).map((pause) => ({
        day: pause.day,
        startTime: pause.startTime,
        endTime: pause.endTime,
      })),
      leaves: (document.leaves ?? []).map((leave) => ({
        startDate: leave.startDate,
        endDate: leave.endDate,
        reason: leave.reason ?? null,
        createdAt: leave.createdAt,
      })),
      slotDurationMinutes: document.slotDurationMinutes ?? 30,
      bufferTimeMinutes: document.bufferTimeMinutes ?? 0,
      verificationStatus: document.verificationStatus,
      rejectionReason: document.rejectionReason ?? null,
      consultationFee: document.consultationFee ?? null,
      feeChangeRequests: (document.feeChangeRequests ?? []).map((request) => ({
        id: request.requestId,
        currentFeeAtRequest: request.currentFeeAtRequest ?? null,
        requestedFee: request.requestedFee,
        reason: request.reason ?? null,
        status: request.status,
        reviewerId: request.reviewerId?.toString() ?? null,
        reviewReason: request.reviewReason ?? null,
        requestedAt: request.requestedAt,
        reviewedAt: request.reviewedAt ?? null,
      })),
      documents: (document.documents ?? []).map((item) => ({
        documentType: item.documentType,
        documentKey: item.documentUrl,
        status: item.status,
        uploadedAt: item.uploadedAt,
        verifiedAt: item.verifiedAt ?? null,
        rejectionReason: item.rejectionReason ?? null,
      })),
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  private toPersistence(doctor: Doctor) {
    return {
      clinicId: new Types.ObjectId(doctor.clinicId),
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      gender: doctor.gender,
      dateOfBirth: doctor.dateOfBirth,
      professionalTitle: doctor.professionalTitle,
      qualifications: doctor.qualifications,
      yearsOfExperience: doctor.yearsOfExperience,
      registrationNumber: doctor.registrationNumber,
      registrationAuthority: doctor.registrationAuthority,
      specializations: doctor.specializations,
      procedures: doctor.procedures,
      workingHours: doctor.workingHours,
      breaks: doctor.breaks,
      leaves: doctor.leaves,
      slotDurationMinutes: doctor.slotDurationMinutes,
      bufferTimeMinutes: doctor.bufferTimeMinutes,
      verificationStatus: doctor.verificationStatus,
      rejectionReason: doctor.rejectionReason,
      consultationFee: doctor.consultationFee,
      feeChangeRequests: doctor.feeChangeRequests.map((request) => ({
        requestId: request.id,
        currentFeeAtRequest: request.currentFeeAtRequest,
        requestedFee: request.requestedFee,
        reason: request.reason,
        status: request.status,
        reviewerId: request.reviewerId ? new Types.ObjectId(request.reviewerId) : null,
        reviewReason: request.reviewReason,
        requestedAt: request.requestedAt,
        reviewedAt: request.reviewedAt,
      })),
      documents: doctor.documents.map((item) => ({
        documentType: item.documentType,
        documentUrl: item.documentKey,
        status: item.status,
        uploadedAt: item.uploadedAt,
        verifiedAt: item.verifiedAt,
        rejectionReason: item.rejectionReason,
      })),
    };
  }
}
