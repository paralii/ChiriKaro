import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { Doctor } from "@domain/entities/doctor.entity.ts";
import type { IUpdateClinicDoctorSpecializationsUseCase } from "@application/interfaces/use-cases/clinic/IUpdateClinicDoctorSpecializationsUseCase.ts";
import type {
  ClinicDoctorSpecializationDTO,
  UpdateClinicDoctorSpecializationsDTO,
} from "@application/dto/clinic/clinic-doctor-specialization.dto.ts";
import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { DomainError } from "@domain/error/DomainError.ts";

const normalize = (value: string): string => value.trim().toLocaleLowerCase();

const toDTO = (doctor: Doctor): ClinicDoctorSpecializationDTO => ({
  doctorId: doctor.id!,
  firstName: doctor.firstName,
  lastName: doctor.lastName,
  verificationStatus: doctor.verificationStatus,
  specializations: doctor.specializations,
});

export class UpdateClinicDoctorSpecializationsUseCase implements IUpdateClinicDoctorSpecializationsUseCase {
  constructor(
    private readonly doctorRepository: IDoctorRepository,
    private readonly clinicRepository: IClinicRepository,
  ) {}

  async execute(dto: UpdateClinicDoctorSpecializationsDTO): Promise<ClinicDoctorSpecializationDTO> {
    if (!/^[a-f\d]{24}$/i.test(dto.clinicId) || !/^[a-f\d]{24}$/i.test(dto.doctorId)) {
      throw new BadRequestError("Clinic or doctor id is invalid");
    }
    if (!Array.isArray(dto.specializations) || dto.specializations.length === 0 || dto.specializations.some((item) => typeof item !== "string")) {
      throw new ValidationError("Select at least one doctor specialization");
    }
    const clinic = await this.clinicRepository.findById(dto.clinicId);
    if (!clinic) throw new NotFoundError("Clinic");
    const doctor = await this.doctorRepository.findByIdAndClinic(dto.doctorId, dto.clinicId);
    if (!doctor) throw new NotFoundError("Doctor");

    const options = new Map(clinic.specializations.map((value) => [normalize(value), value]));
    const selected = dto.specializations as string[];
    const selectedKeys = selected.map(normalize);
    if (new Set(selectedKeys).size !== selectedKeys.length) {
      throw new ValidationError("Doctor specializations must not contain duplicates");
    }
    const canonical = selectedKeys.map((key) => {
      const option = options.get(key);
      if (!option) throw new ValidationError("Doctor specializations must be selected from the clinic specializations");
      return option;
    });

    try {
      doctor.reassignSpecializations(canonical);
    } catch (error) {
      if (error instanceof DomainError) throw new ValidationError(error.message);
      throw error;
    }
    return toDTO(await this.doctorRepository.save(doctor));
  }
}
