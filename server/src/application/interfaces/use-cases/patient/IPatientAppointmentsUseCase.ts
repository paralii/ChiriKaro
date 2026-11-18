import type { AppointmentDTO, CreateAppointmentInput } from "@application/dto/patient/appointment.dto.ts";

export interface IPatientAppointmentsUseCase {
  create(input: CreateAppointmentInput): Promise<AppointmentDTO>;
  list(patientUserId: string): Promise<AppointmentDTO[]>;
  get(appointmentId: string, patientUserId: string): Promise<AppointmentDTO>;
}
