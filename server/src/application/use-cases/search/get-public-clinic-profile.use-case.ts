import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IPublicListingIdService } from "@application/interfaces/services/IPublicListingIdService.ts";
import type { IGetPublicClinicProfileUseCase } from "@application/interfaces/use-cases/search/IGetPublicClinicProfileUseCase.ts";
import type { PublicClinicProfileDTO } from "@application/dto/search/public-profile.dto.ts";
import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";
import { ClinicSetupStatus } from "@domain/enum/clinic-setup-status.enum.ts";
import { UserStatus } from "@domain/enum/user-statues.enum.ts";
import { Role } from "@domain/value-objects/Role.ts";
import { NotFoundError } from "@shared/errors/index.ts";

function minutes(value: string): number {
  const [hours, mins] = value.split(":").map(Number);
  return hours! * 60 + mins!;
}

function hasScheduleOverlap(
  doctor: { workingHours: Array<{ day: string; isOpen: boolean; startTime: string; endTime: string }> },
  clinic: { workingHours: Array<{ day: string; isOpen: boolean; startTime: string; endTime: string }> },
): boolean {
  return doctor.workingHours.some((hours) => hours.isOpen && clinic.workingHours.some((clinicHours) =>
    clinicHours.isOpen && clinicHours.day.toUpperCase() === hours.day.toUpperCase() &&
    Math.max(minutes(clinicHours.startTime), minutes(hours.startTime)) < Math.min(minutes(clinicHours.endTime), minutes(hours.endTime))));
}

export class GetPublicClinicProfileUseCase implements IGetPublicClinicProfileUseCase {
  constructor(
    private readonly _listingIdService: IPublicListingIdService,
    private readonly _clinicRepository: IClinicRepository,
    private readonly _doctorRepository: IDoctorRepository,
    private readonly _userRepository: IUserRepository,
  ) {}

  async execute(listingId: string): Promise<PublicClinicProfileDTO> {
    const claims = this._listingIdService.read(listingId);
    const clinic = await this._clinicRepository.findById(claims.clinicId);
    if (!clinic || clinic.status !== ClinicStatus.APPROVED || clinic.setupStatus !== ClinicSetupStatus.VERIFIED) {
      throw new NotFoundError("Clinic was not found");
    }

    const [requestingDoctor, clinicUsers] = await Promise.all([
      this._doctorRepository.findByUserId(claims.doctorUserId),
      this._userRepository.findByClinic(clinic.id!),
    ]);
    const activeDoctorIds = new Set(clinicUsers.filter((user) => user.role === Role.DOCTOR && user.status === UserStatus.ACTIVE).map((user) => user.id));
    if (!requestingDoctor || requestingDoctor.clinicId !== clinic.id || requestingDoctor.verificationStatus !== "VERIFIED" ||
      !activeDoctorIds.has(requestingDoctor.userId) || requestingDoctor.consultationFee === null || requestingDoctor.consultationFee <= 0 || !hasScheduleOverlap(requestingDoctor, clinic)) {
      throw new NotFoundError("Clinic was not found");
    }

    const doctors = await this._doctorRepository.findByClinicAndStatus(clinic.id!, "VERIFIED");
    const publicDoctors = doctors.filter((doctor) => activeDoctorIds.has(doctor.userId) && doctor.consultationFee !== null && doctor.consultationFee > 0 && hasScheduleOverlap(doctor, clinic));

    return {
      name: clinic.name,
      description: clinic.description,
      clinicType: clinic.clinicType,
      address: clinic.address ?? null,
      city: clinic.city ?? null,
      state: clinic.state ?? null,
      pincode: clinic.pincode ?? null,
      phone: clinic.phone ?? null,
      specializations: clinic.specializations,
      doctors: publicDoctors.map((doctor) => ({
        listingId: this._listingIdService.create({ clinicId: clinic.id!, doctorUserId: doctor.userId }),
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        professionalTitle: doctor.professionalTitle,
        specializations: doctor.specializations,
        consultationFee: doctor.consultationFee!,
        currency: "INR",
      })),
    };
  }
}
