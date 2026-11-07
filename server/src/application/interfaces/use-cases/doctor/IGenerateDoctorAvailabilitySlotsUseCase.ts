import type { DoctorAvailabilitySlotsDTO } from "@application/dto/doctor/doctor-availability.dto.ts";

export interface IGenerateDoctorAvailabilitySlotsUseCase {
  execute(userId: string, clinicId: string): Promise<DoctorAvailabilitySlotsDTO>;
}
