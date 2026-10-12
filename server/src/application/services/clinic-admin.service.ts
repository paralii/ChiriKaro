import { Clinic, ClinicStatus } from "../../domain/entities/clinic.entity.js";
import { UserStatus } from "../../shared/enums/user-statues.enum.js";
import { NotFoundError } from "../../shared/errors/index.js";
import type { IClinicRepository, IUserRepository } from "../interfaces/clinic.ports.js";

export interface ClinicStatusSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  blocked: number;
}

/** Super-admin use cases for managing clinics. */
export class ClinicAdminService {
  constructor(
    private readonly clinicRepository: IClinicRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  listClinics(): Promise<Clinic[]> {
    return this.clinicRepository.findAll();
  }

  async getStatusSummary(): Promise<ClinicStatusSummary> {
    const clinics = await this.clinicRepository.findAll();
    const count = (status: ClinicStatus) => clinics.filter((clinic) => clinic.status === status).length;

    return {
      total: clinics.length,
      pending: count(ClinicStatus.PENDING),
      approved: count(ClinicStatus.APPROVED),
      rejected: count(ClinicStatus.REJECTED),
      blocked: count(ClinicStatus.BLOCKED),
    };
  }

  async updateStatus(clinicId: string, status: ClinicStatus): Promise<Clinic> {
    const clinic = await this.clinicRepository.findById(clinicId);
    if (!clinic) throw new NotFoundError("Clinic");

    this.applyStatus(clinic, status);
    const updatedClinic = await this.clinicRepository.save(clinic);

    await this.syncOwnerStatus(updatedClinic.ownerAdminId, status);
    return updatedClinic;
  }

  private applyStatus(clinic: Clinic, status: ClinicStatus): void {
    switch (status) {
      case ClinicStatus.APPROVED:
        clinic.approve();
        break;
      case ClinicStatus.REJECTED:
        clinic.reject();
        break;
      case ClinicStatus.BLOCKED:
        clinic.block();
        break;
      default:
        clinic.markPending();
    }
  }

  private async syncOwnerStatus(ownerAdminId: string | null | undefined, status: ClinicStatus): Promise<void> {
    if (!ownerAdminId) return;

    const owner = await this.userRepository.findById(ownerAdminId);
    if (!owner) return;

    owner.setStatus(this.toOwnerStatus(status));
    await this.userRepository.save(owner);
  }

  private toOwnerStatus(status: ClinicStatus): UserStatus {
    if (status === ClinicStatus.APPROVED) return UserStatus.ACTIVE;
    if (status === ClinicStatus.PENDING) return UserStatus.INVITED;
    return UserStatus.SUSPENDED;
  }
}