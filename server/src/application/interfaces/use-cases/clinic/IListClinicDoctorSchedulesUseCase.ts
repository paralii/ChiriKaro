import type { ClinicDoctorScheduleDTO } from "@application/dto/doctor/doctor-availability.dto.ts";

export interface IListClinicDoctorSchedulesUseCase {
  execute(clinicId: string): Promise<ClinicDoctorScheduleDTO[]>;
}
