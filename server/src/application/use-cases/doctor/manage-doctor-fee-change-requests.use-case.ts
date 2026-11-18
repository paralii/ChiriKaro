import { DomainError } from "@domain/error/DomainError.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IIdGenerator } from "@application/interfaces/services/IIdGenerator.ts";
import type { IManageDoctorFeeChangeRequestsUseCase } from "@application/interfaces/use-cases/doctor/IManageDoctorFeeChangeRequestsUseCase.ts";
import type { CreateDoctorFeeChangeRequestDTO, DoctorFeeChangeRequestDTO, ReviewDoctorFeeChangeRequestDTO } from "@application/dto/doctor/doctor-fee-change-request.dto.ts";
import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";

const validId = (value: string) => /^[a-f\d]{24}$/i.test(value);
const toDTO = (doctor: Awaited<ReturnType<IDoctorRepository["findByUserId"]>>, requestId: string): DoctorFeeChangeRequestDTO => {
  if (!doctor) throw new NotFoundError("Doctor profile");
  const request = doctor.feeChangeRequests.find((item) => item.id === requestId);
  if (!request) throw new NotFoundError("Fee change request");
  return {
    requestId: request.id,
    doctorId: doctor.id!,
    currentFeeAtRequest: request.currentFeeAtRequest,
    requestedFee: request.requestedFee,
    reason: request.reason,
    status: request.status,
    reviewReason: request.reviewReason,
    requestedAt: request.requestedAt,
    reviewedAt: request.reviewedAt,
  };
};

export class ManageDoctorFeeChangeRequestsUseCase implements IManageDoctorFeeChangeRequestsUseCase {
  constructor(private readonly doctors: IDoctorRepository, private readonly ids: IIdGenerator) {}

  async listForDoctor(userId: string, clinicId: string): Promise<DoctorFeeChangeRequestDTO[]> {
    if (!validId(userId) || !validId(clinicId)) throw new BadRequestError("Doctor or clinic id is invalid");
    const doctor = await this.doctors.findByUserId(userId);
    if (!doctor || doctor.clinicId !== clinicId) throw new NotFoundError("Doctor profile");
    return doctor.feeChangeRequests.map((request) => toDTO(doctor, request.id));
  }

  async request(userId: string, clinicId: string, dto: CreateDoctorFeeChangeRequestDTO): Promise<DoctorFeeChangeRequestDTO> {
    if (!validId(userId) || !validId(clinicId)) throw new BadRequestError("Doctor or clinic id is invalid");
    if (typeof dto.requestedFee !== "number" || !Number.isFinite(dto.requestedFee)) throw new ValidationError("requestedFee must be a valid number");
    if (dto.reason !== undefined && dto.reason !== null && typeof dto.reason !== "string") throw new ValidationError("reason must be a string");
    const doctor = await this.doctors.findByUserId(userId);
    if (!doctor || doctor.clinicId !== clinicId) throw new NotFoundError("Doctor profile");
    try {
      const request = doctor.requestConsultationFeeChange(this.ids.generate(), dto.requestedFee, dto.reason as string | null | undefined ?? null);
      const saved = await this.doctors.save(doctor);
      return toDTO(saved, request.id);
    } catch (error) {
      if (error instanceof DomainError) throw new ValidationError(error.message);
      throw error;
    }
  }

  async listPendingForClinic(clinicId: string): Promise<DoctorFeeChangeRequestDTO[]> {
    if (!validId(clinicId)) throw new BadRequestError("Clinic id is invalid");
    const doctors = await this.doctors.findByClinic(clinicId);
    return doctors.flatMap((doctor) => doctor.feeChangeRequests
      .filter((request) => request.status === "PENDING")
      .map((request) => ({ ...toDTO(doctor, request.id), doctorName: `${doctor.firstName} ${doctor.lastName}`.trim() })));
  }

  async review(dto: ReviewDoctorFeeChangeRequestDTO): Promise<DoctorFeeChangeRequestDTO> {
    if (!validId(dto.clinicId) || !validId(dto.doctorId)) throw new BadRequestError("Doctor or clinic id is invalid");
    if (typeof dto.requestId !== "string" || !dto.requestId.trim()) throw new BadRequestError("Fee change request id is invalid");
    if (dto.decision !== "APPROVED" && dto.decision !== "REJECTED") throw new ValidationError("decision must be APPROVED or REJECTED");
    if (dto.reason !== undefined && dto.reason !== null && typeof dto.reason !== "string") throw new ValidationError("reason must be a string");
    const doctor = await this.doctors.findByIdAndClinic(dto.doctorId, dto.clinicId);
    if (!doctor) throw new NotFoundError("Doctor");
    try {
      const request = doctor.reviewConsultationFeeChange(dto.requestId, dto.decision, dto.reviewerId, dto.reason as string | null | undefined ?? null);
      const saved = await this.doctors.save(doctor);
      return toDTO(saved, request.id);
    } catch (error) {
      if (error instanceof DomainError) throw new ValidationError(error.message);
      throw error;
    }
  }
}
