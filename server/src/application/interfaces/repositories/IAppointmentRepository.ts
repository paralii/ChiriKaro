import type { AppointmentRecord } from "@domain/entities/booking-workflow.entity.ts";

export interface AppointmentSlotReservation {
  clinicId: string;
  doctorUserId: string;
  localDate: string;
  patientUserId: string;
  appointmentId: string;
  startsAt: Date;
  endsAt: Date;
  holdExpiresAt: Date;
}

export interface IAppointmentRepository {
  findByIdempotencyKey(patientUserId: string, idempotencyKey: string): Promise<AppointmentRecord | null>;
  reserveSlot(reservation: AppointmentSlotReservation): Promise<boolean>;
  releaseSlot(reservation: AppointmentSlotReservation): Promise<void>;
  create(appointment: AppointmentRecord): Promise<AppointmentRecord>;
  findActiveOverlaps(clinicId: string, doctorUserId: string, localDate: string, startsAt: Date, endsAt: Date, now: Date): Promise<Array<{ startsAt: Date; endsAt: Date }>>;
  findForPatient(patientUserId: string): Promise<AppointmentRecord[]>;
  findOwnedById(appointmentId: string, patientUserId: string): Promise<AppointmentRecord | null>;
}
