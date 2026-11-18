import type { ConfigureClinicDoctorWorkingHoursInput, DoctorAvailabilityDTO } from "@application/dto/doctor/doctor-availability.dto.ts";

export interface IConfigureClinicDoctorWorkingHoursUseCase {
  executeForClinicAdmin(input: ConfigureClinicDoctorWorkingHoursInput): Promise<DoctorAvailabilityDTO>;
}
