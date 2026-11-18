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
  status?: "PENDING_PAYMENT" | "CONFIRMED";
}

export interface IAppointmentRepository {
  findByIdempotencyKey(patientUserId: string, idempotencyKey: string): Promise<AppointmentRecord | null>;
  reserveSlot(reservation: AppointmentSlotReservation): Promise<boolean>;
  releaseSlot(reservation: AppointmentSlotReservation): Promise<void>;
  create(appointment: AppointmentRecord): Promise<AppointmentRecord>;
  findActiveOverlaps(clinicId: string, doctorUserId: string, localDate: string, startsAt: Date, endsAt: Date, now: Date): Promise<Array<{ startsAt: Date; endsAt: Date }>>;
  findForPatient(patientUserId: string): Promise<AppointmentRecord[]>;
  findOwnedById(appointmentId: string, patientUserId: string): Promise<AppointmentRecord | null>;
  findConfirmedForQueue(appointmentId: string, clinicId: string): Promise<AppointmentRecord | null>;
  cancelOwned(appointmentId: string, patientUserId: string, now: Date, cutoff: Date): Promise<AppointmentRecord | null>;
  rescheduleOwned(appointmentId: string, patientUserId: string, now: Date, cutoff: Date, slot: AppointmentRecord["slot"]): Promise<AppointmentRecord | null>;
}
