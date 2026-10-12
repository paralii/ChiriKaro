import { NotFoundError } from "../../shared/errors/index.js";
import type {
  ClinicProfile,
  ClinicProfileUpdate,
  ClinicWorkingHour,
  IClinicProfileRepository,
  IClinicRepository,
} from "../interfaces/clinic.ports.js";

export class ClinicProfileService {
  constructor(
    private readonly clinicRepository: IClinicRepository,
    private readonly profileRepository: IClinicProfileRepository,
  ) {}

  async getProfile(clinicId: string): Promise<ClinicProfile> {
    const profile = await this.profileRepository.findProfileById(clinicId);
    if (!profile) throw new NotFoundError("Clinic");
    return profile;
  }

  async updateProfile(clinicId: string, updates: ClinicProfileUpdate): Promise<ClinicProfile> {
    const profile = await this.profileRepository.updateProfile(clinicId, updates);
    if (!profile) throw new NotFoundError("Clinic");
    return profile;
  }

  async getDashboard(clinicId: string) {
    const clinic = await this.clinicRepository.findById(clinicId);
    if (!clinic) throw new NotFoundError("Clinic");

    const profile = await this.profileRepository.findProfileById(clinicId);

    return {
      id: clinic.id,
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      ownerName: clinic.ownerName,
      contactEmail: clinic.contactEmail,
      description: profile?.description ?? null,
      city: profile?.city ?? null,
      state: profile?.state ?? null,
      pincode: profile?.pincode ?? null,
      registrationNumber: profile?.registrationNumber ?? null,
      clinicType: profile?.clinicType ?? null,
      specializations: profile?.specializations ?? [],
      workingHours: profile?.workingHours ?? [],
      status: clinic.status,
      isActive: clinic.isActive,
    };
  }

  async updateSpecializations(clinicId: string, specializations: string[]): Promise<string[]> {
    const updated = await this.profileRepository.updateSpecializations(clinicId, specializations);
    if (!updated) throw new NotFoundError("Clinic");
    return updated;
  }

  async updateWorkingHours(clinicId: string, workingHours: ClinicWorkingHour[]): Promise<ClinicWorkingHour[]> {
    const updated = await this.profileRepository.updateWorkingHours(clinicId, workingHours);
    if (!updated) throw new NotFoundError("Clinic");
    return updated;
  }
}