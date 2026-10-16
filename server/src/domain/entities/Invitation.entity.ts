import { isClinicScopedRole, Role } from "@domain/value-objects/Role.js";
import { InvitationStatus } from "@domain/enum/invitation-status.enum.ts";
import {
  InvalidInvitationDataError,
  InvalidRoleAssignmentError,
  InvitationExpiredError,
  InvitationAlreadyUsedError,
  InvitationCancelledError,
} from "@domain/error/DomainError.ts";

export interface InvitationProps {
  id: string;
  email: string;
  role: Role;
  clinicId: string;
  invitedBy: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_TTL_HOURS = 72;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

function requireNonBlank(value: string, field: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new InvalidInvitationDataError(`Invitation ${field} must not be blank`);
  }
  return trimmed;
}

export class Invitation {
  private constructor(private props: InvitationProps) {}

  static create(props: {
    id: string;
    email: string;
    role: Role;
    clinicId: string;
    invitedBy: string;
    ttl?: number;
  }): Invitation {
    const id = requireNonBlank(props.id, "id");
    const email = requireNonBlank(props.email, "email");
    if (!EMAIL_PATTERN.test(email)) {
      throw new InvalidInvitationDataError("Invitation email is not a valid email address");
    }
    const invitedBy = requireNonBlank(props.invitedBy, "invitedBy");

    const needsClinicId = isClinicScopedRole(props.role);  
    const clinicId = props.clinicId?.trim() ?? "";

    if (needsClinicId && !clinicId) {
      throw new InvalidRoleAssignmentError(
        `Role ${props.role} requires a clinicId`
      );
    }

    const ttl = props.ttl ?? DEFAULT_TTL_HOURS;
    if (!Number.isFinite(ttl) || ttl <= 0) {
      throw new InvalidInvitationDataError("Invitation ttl must be a finite number greater than 0");
    }

    const now = new Date();
    return new Invitation({
      id,
      email,
      role: props.role,
      clinicId,
      invitedBy,
      status: InvitationStatus.PENDING,
      expiresAt: new Date(now.getTime() + ttl * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: new Date(now),
    });
  }

  static fromPersistence(props: InvitationProps): Invitation {
    return new Invitation({
      ...props,
      expiresAt: new Date(props.expiresAt),
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    });
  }

  assertUsable(): void {
    switch (this.props.status) {
      case InvitationStatus.ACCEPTED:
        throw new InvitationAlreadyUsedError(this.props.id);
      case InvitationStatus.CANCELLED:
        throw new InvitationCancelledError(this.props.id);
      case InvitationStatus.EXPIRED:
        throw new InvitationExpiredError(this.props.id);
    }
    if (this.isPastExpiry()) {
      throw new InvitationExpiredError(this.props.id);
    }
  }

  accept(): void {
    this.assertUsable();
    this.props.status = InvitationStatus.ACCEPTED;
    this.touch();
  }

  revoke(): void {
    switch (this.props.status) {
      case InvitationStatus.ACCEPTED:
        throw new InvitationAlreadyUsedError(this.props.id);
      case InvitationStatus.CANCELLED:
        throw new InvitationCancelledError(this.props.id);
      case InvitationStatus.EXPIRED:
        throw new InvitationExpiredError(this.props.id);
    }
    if (this.isPastExpiry()) {
      throw new InvitationExpiredError(this.props.id);
    }
    this.props.status = InvitationStatus.CANCELLED;
    this.touch();
  }

  cancel(): void {
    this.revoke();
  }

  expireIfDue(): boolean {
    if (this.props.status === InvitationStatus.PENDING && this.isPastExpiry()) {
      this.props.status = InvitationStatus.EXPIRED;
      this.touch();
      return true;
    }
    return false;
  }
 
  private isPastExpiry(): boolean {
    return new Date() > this.props.expiresAt;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  get id() { return this.props.id; }
  get email() { return this.props.email; }
  get role() { return this.props.role; }
  get clinicId() { return this.props.clinicId; }
  get invitedBy() { return this.props.invitedBy; }
  get status() { return this.props.status; }
  get expiresAt() { return this.props.expiresAt; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}