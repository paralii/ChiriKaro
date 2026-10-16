import { Role, isClinicScopedRole } from "@domain/value-objects/Role.js";
import { UserStatus } from "@domain/enum/user-statues.enum.ts";
import {
  InvalidRoleAssignmentError,
  InvalidUserDataError,
  MissingCredentialsError,
} from "@domain/error/DomainError.ts";

export interface UserProps {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: Role;
  status: UserStatus;
  clinicId: string | null;
  googleId?: string;
  avatar?: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type NewUserProps = Pick<
  UserProps,
  "id" | "name" | "email" | "role" | "clinicId"
> &
  Partial<
    Pick<
      UserProps,
      "passwordHash" | "googleId" | "avatar" | "status" | "isEmailVerified"
    >
  >;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

function requireNonBlank(value: string, field: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new InvalidUserDataError(`User ${field} must not be blank`);
  }
  return trimmed;
}

function requireEmail(value: string): string {
  const email = requireNonBlank(value, "email");
  if (!EMAIL_PATTERN.test(email)) {
    throw new InvalidUserDataError("User email is not a valid email address");
  }
  return email;
}

export class User {
  private constructor(private props: UserProps) {}

  static create(props: NewUserProps): User {
    const id = requireNonBlank(props.id, "id");
    const name = requireNonBlank(props.name, "name");
    const email = requireEmail(props.email).toLowerCase();

    const needsClinic = isClinicScopedRole(props.role);
    const clinicId = props.clinicId?.trim() || null;

    if (needsClinic && !clinicId) {
      throw new InvalidRoleAssignmentError(
        `Role ${props.role} requires a clinicId`,
      );
    }
    if (!needsClinic && clinicId) {
      throw new InvalidRoleAssignmentError(
        `Role ${props.role} must not belong to a clinic`,
      );
    }

    const passwordHash = props.passwordHash?.trim();
    const googleId = props.googleId?.trim();

    if (!passwordHash && !googleId) {
      throw new MissingCredentialsError();
    }

    const now = new Date();
    return new User({
      id,
      name,
      email,
      role: props.role,
      clinicId,
      status: props.status ?? UserStatus.INVITED,
      isEmailVerified: props.isEmailVerified ?? false,
      avatar: props.avatar ?? null,
      ...(passwordHash ? { passwordHash } : {}),
      ...(googleId ? { googleId } : {}),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: UserProps): User {
    return new User({
      ...props,
      createdAt: new Date(props.createdAt.getTime()),
      updatedAt: new Date(props.updatedAt.getTime()),
    });
  }

  activate(): void {
    this.props.status = UserStatus.ACTIVE;
    this.touch();
  }

  suspend(): void {
    this.props.status = UserStatus.SUSPENDED;
    this.touch();
  }

  rename(name: string): void {
    this.props.name = requireNonBlank(name, "name");
    this.touch();
  }

  verifyEmail(): void {
    if (!this.props.isEmailVerified) {
      this.props.isEmailVerified = true;
      this.touch();
    }
  }

  changePasswordHash(passwordHash: string): void {
    if (!passwordHash) {
      throw new InvalidUserDataError("Password hash must not be empty");
    }
    this.props.passwordHash = passwordHash;
    this.touch();
  }

  belongsToClinic(clinicId: string): boolean {
    return this.props.clinicId === clinicId;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  get id() {
    return this.props.id;
  }
  get name() {
    return this.props.name;
  }
  get email() {
    return this.props.email;
  }
  get passwordHash() {
    return this.props.passwordHash;
  }
  get role() {
    return this.props.role;
  }
  get status() {
    return this.props.status;
  }
  get clinicId() {
    return this.props.clinicId;
  }
  get googleId() {
    return this.props.googleId;
  }
  get avatar() {
    return this.props.avatar;
  }
  get isEmailVerified() {
    return this.props.isEmailVerified;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  toSafeObject(): Omit<UserProps, "passwordHash"> {
    const { passwordHash: _omitted, ...rest } = this.props;
    return { ...rest, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
