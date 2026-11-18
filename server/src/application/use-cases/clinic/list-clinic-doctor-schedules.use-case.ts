import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IListClinicDoctorSchedulesUseCase } from "@application/interfaces/use-cases/clinic/IListClinicDoctorSchedulesUseCase.ts";
import type { ClinicDoctorScheduleDTO } from "@application/dto/doctor/doctor-availability.dto.ts";
import { BadRequestError } from "@shared/errors/index.ts";

export class ListClinicDoctorSchedulesUseCase implements IListClinicDoctorSchedulesUseCase {
  constructor(private readonly doctorRepository: IDoctorRepository) {}

  async execute(clinicId: string): Promise<ClinicDoctorScheduleDTO[]> {
    if (!/^[a-f\d]{24}$/i.test(clinicId)) throw new BadRequestError("Clinic id is invalid");
    const doctors = await this.doctorRepository.findByClinic(clinicId);
    return doctors
      .filter((doctor) => doctor.clinicId === clinicId)
      .map((doctor) => ({
        doctorId: doctor.id!,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        verificationStatus: doctor.verificationStatus,
        workingHours: doctor.workingHours,
      }));
  }
}
