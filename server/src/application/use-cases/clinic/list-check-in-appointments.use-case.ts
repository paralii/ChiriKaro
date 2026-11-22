import type { AppointmentRecord } from "@domain/entities/booking-workflow.entity.ts";
import type { IAppointmentRepository } from "@application/interfaces/repositories/IAppointmentRepository.ts";
import type { IQueueClinicContext } from "@application/interfaces/services/IQueueClinicContext.ts";
import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import { Role } from "@domain/value-objects/Role.ts";
import { ForbiddenError } from "@shared/errors/index.ts";
import { UserStatus } from "@domain/enum/user-statues.enum.ts";

export interface CheckInAppointmentOption {
  appointmentId: string;
  patientName: string;
  doctorName: string;
  localStartTime: string;
  localEndTime: string;
}

export class ListCheckInAppointmentsUseCase {
  constructor(private readonly appointments: IAppointmentRepository, private readonly users: IUserRepository, private readonly context: IQueueClinicContext) {}

  async execute(input: { clinicId: string; actorRole: string }): Promise<CheckInAppointmentOption[]> {
    if (input.actorRole !== Role.CLINIC_ADMIN && input.actorRole !== Role.STAFF) throw new ForbiddenError("Appointment check-in options are not available");
    const clinic = await this.context.getOperationalClinic(input.clinicId);
    const localDate = this.context.localDate(new Date(), clinic.timeZone);
    const appointments = await this.appointments.findConfirmedForClinicDate(input.clinicId, localDate);
    const options = await Promise.all(appointments.map(async (appointment: AppointmentRecord) => {
      const patient = await this.users.findById(appointment.patientUserId);
      if (!patient || patient.status !== UserStatus.ACTIVE || patient.role !== Role.PATIENT) return null;
      return {
        appointmentId: appointment.id,
        patientName: patient.name,
        doctorName: appointment.doctorNameSnapshot,
        localStartTime: appointment.slot.localStartTime,
        localEndTime: appointment.slot.localEndTime,
      };
    }));
    return options.filter((option): option is CheckInAppointmentOption => option !== null);
  }
}
