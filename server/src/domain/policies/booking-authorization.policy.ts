import { Role } from "@domain/value-objects/Role.ts";

export type BookingOperation =
  | "READ_OWN_APPOINTMENT"
  | "BOOK_APPOINTMENT"
  | "CANCEL_OWN_APPOINTMENT"
  | "READ_ASSIGNED_QUEUE"
  | "UPDATE_ASSIGNED_VISIT_STATUS"
  | "REGISTER_WALK_IN"
  | "MANAGE_CLINIC_QUEUE"
  | "READ_CLINIC_APPOINTMENTS";

export interface BookingActor {
  userId: string;
  role: Role;
  clinicId: string | null;
}

export interface BookingResourceScope {
  patientId?: string;
  clinicId: string;
  doctorUserId?: string;
}

/**
 * Checks role and resource scope for booking workflows. Callers must pass identity
 * and clinic scope from verified server-side authentication, never request data.
 */
export function canPerformBookingOperation(
  actor: BookingActor,
  operation: BookingOperation,
  resource: BookingResourceScope,
): boolean {
  switch (operation) {
    case "READ_OWN_APPOINTMENT":
    case "CANCEL_OWN_APPOINTMENT":
      return actor.role === Role.PATIENT && resource.patientId === actor.userId;
    case "BOOK_APPOINTMENT":
      return actor.role === Role.PATIENT;
    case "READ_ASSIGNED_QUEUE":
    case "UPDATE_ASSIGNED_VISIT_STATUS":
      return actor.role === Role.DOCTOR && actor.userId === resource.doctorUserId && actor.clinicId === resource.clinicId;
    case "REGISTER_WALK_IN":
    case "MANAGE_CLINIC_QUEUE":
    case "READ_CLINIC_APPOINTMENTS":
      return (actor.role === Role.CLINIC_ADMIN || actor.role === Role.STAFF) && actor.clinicId === resource.clinicId;
  }
}
