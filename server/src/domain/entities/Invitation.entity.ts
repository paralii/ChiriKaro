import { Role } from "../value-objects/Role.js";
import {
  InvitationExpiredError,
  InvitationAlreadyUsedError,
  InvitationCancelledError,
  InvitationRevokedError,
} from "../../shared/errors/DomainError.js";

export enum InvitationStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  REVOKED = "CANCELLED",
}

export interface InvitationProps {
  id: string;
  email: string;
  role: Role;
  clinicId: string | null;
  invitedBy: string;
  token: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_TTL_HOURS = 72;

export class Invitation {
  private constructor(private props: InvitationProps) {}

  static create(props: {
    id: string;
    email: string;
    role: Role;
    clinicId: string | null;
    invitedBy: string;
    token: string;
    ttlHours?: number;
  }): Invitation {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + (props.ttlHours ?? DEFAULT_TTL_HOURS) * 60 * 60 * 1000
    );

    return new Invitation({
      id: props.id,
      email: props.email,
      role: props.role,
      clinicId: props.clinicId,
      invitedBy: props.invitedBy,
      token: props.token,
      status: InvitationStatus.PENDING,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: InvitationProps): Invitation {
    return new Invitation(props);
  }

  /**
   * Called by ValidateInvitationTokenUseCase (before showing the registration
   * form) and again by RegisterViaInvitationUseCase (before creating the User).
   * Centralizing this rule here is exactly why Invitation is an entity and
   * not logic duplicated inside two separate use-cases.
   */
  assertUsable(): void {
    if (this.props.status === InvitationStatus.ACCEPTED) {
      throw new InvitationAlreadyUsedError(this.props.id);
    }
    if (this.props.status === InvitationStatus.CANCELLED) {
      throw new InvitationCancelledError(this.props.id);
    }
    if (new Date() > this.props.expiresAt) {
      this.props.status = InvitationStatus.EXPIRED;
      throw new InvitationExpiredError(this.props.id);
    }
  }

  accept(): void {
    this.assertUsable();
    this.props.status = InvitationStatus.ACCEPTED;
    this.touch();
  }

  revoke(): void {
    this.props.status = InvitationStatus.CANCELLED;
    this.touch();
  }

  cancel(): void {
    this.revoke();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  get id() { return this.props.id; }
  get email() { return this.props.email; }
  get role() { return this.props.role; }
  get clinicId() { return this.props.clinicId; }
  get invitedBy() { return this.props.invitedBy; }
  get token() { return this.props.token; }
  get status() { return this.props.status; }
  get expiresAt() { return this.props.expiresAt; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}