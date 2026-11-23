import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IPublicListingIdService } from "@application/interfaces/services/IPublicListingIdService.ts";
import type { IGetPublicDoctorProfileUseCase } from "@application/interfaces/use-cases/search/IGetPublicDoctorProfileUseCase.ts";
import type { PublicDoctorProfileDTO } from "@application/dto/search/public-profile.dto.ts";
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

export class GetPublicDoctorProfileUseCase implements IGetPublicDoctorProfileUseCase {
  constructor(
    private readonly _listingIdService: IPublicListingIdService,
    private readonly _clinicRepository: IClinicRepository,
    private readonly _doctorRepository: IDoctorRepository,
    private readonly _userRepository: IUserRepository,
  ) {}

  async execute(listingId: string): Promise<PublicDoctorProfileDTO> {
    const claims = this._listingIdService.read(listingId);
    const [clinic, doctor] = await Promise.all([
      this._clinicRepository.findById(claims.clinicId),
      this._doctorRepository.findByUserId(claims.doctorUserId),
    ]);
    if (!clinic || clinic.status !== ClinicStatus.APPROVED || clinic.setupStatus !== ClinicSetupStatus.VERIFIED ||
      !doctor || doctor.clinicId !== clinic.id || doctor.verificationStatus !== "VERIFIED" ||
      doctor.consultationFee === null || doctor.consultationFee <= 0 ||
      !hasScheduleOverlap(doctor, clinic)) {
      throw new NotFoundError("Doctor was not found");
    }

    const user = await this._userRepository.findById(doctor.userId);
    if (!user || user.role !== Role.DOCTOR || user.status !== UserStatus.ACTIVE) throw new NotFoundError("Doctor was not found");

    const publicClinicListingId = this._listingIdService.create({ clinicId: clinic.id!, doctorUserId: doctor.userId });
    return {
      listingId: this._listingIdService.create(claims),
      name: `${doctor.firstName} ${doctor.lastName}`,
      avatar: user.avatar ?? null,
      professionalTitle: doctor.professionalTitle,
      qualifications: doctor.qualifications,
      yearsOfExperience: doctor.yearsOfExperience,
      specializations: doctor.specializations,
      consultationFee: doctor.consultationFee,
      currency: "INR",
      clinic: {
        listingId: publicClinicListingId,
        name: clinic.name,
        address: clinic.address ?? null,
        city: clinic.city ?? null,
        state: clinic.state ?? null,
        pincode: clinic.pincode ?? null,
        phone: clinic.phone ?? null,
      },
    };
  }
}
