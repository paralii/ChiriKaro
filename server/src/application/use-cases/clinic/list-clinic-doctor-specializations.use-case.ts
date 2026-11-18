import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IListClinicDoctorSpecializationsUseCase } from "@application/interfaces/use-cases/clinic/IListClinicDoctorSpecializationsUseCase.ts";
import type { ClinicDoctorSpecializationDTO } from "@application/dto/clinic/clinic-doctor-specialization.dto.ts";
import { BadRequestError } from "@shared/errors/index.ts";

export class ListClinicDoctorSpecializationsUseCase implements IListClinicDoctorSpecializationsUseCase {
  constructor(private readonly doctorRepository: IDoctorRepository) {}

  async execute(clinicId: string): Promise<ClinicDoctorSpecializationDTO[]> {
    if (!/^[a-f\d]{24}$/i.test(clinicId)) throw new BadRequestError("Clinic id is invalid");
    const doctors = await this.doctorRepository.findByClinic(clinicId);
    return doctors.map((doctor) => ({
      doctorId: doctor.id!,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      verificationStatus: doctor.verificationStatus,
      specializations: doctor.specializations,
    }));
  }
}
