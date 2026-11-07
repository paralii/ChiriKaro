import type { DoctorAvailabilityDTO } from "@application/dto/doctor/doctor-availability.dto.ts";

export interface IGetDoctorAvailabilityUseCase {
  execute(userId: string, clinicId: string): Promise<DoctorAvailabilityDTO>;
}
