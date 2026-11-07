import type { ConfigureDoctorAvailabilityInput, DoctorAvailabilityDTO } from "@application/dto/doctor/doctor-availability.dto.ts";

export interface IConfigureDoctorAvailabilityUseCase {
  execute(input: ConfigureDoctorAvailabilityInput): Promise<DoctorAvailabilityDTO>;
}
