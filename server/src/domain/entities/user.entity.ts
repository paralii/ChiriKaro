import { Role, requiresClinic } from "../value-objects/Role.js";
import { UserStatus } from "../../shared/enums/user-statues.enum.js";
import { InvalidRoleAssignmentError } from "../../shared/errors/DomainError.js";

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

type NewUserProps = Pick<UserProps, "id" | "name" | "email" | "role" | "clinicId"> &
  Partial<Pick<UserProps, "passwordHash" | "googleId" | "avatar" | "status" | "isEmailVerified">>;

export class User {
  private constructor(private props: UserProps) {}

  static create(props: NewUserProps): User {
    const needsClinic = requiresClinic(props.role);

    if (needsClinic && !props.clinicId) {
      throw new InvalidRoleAssignmentError(`Role ${props.role} requires a clinicId`);
    }
    if (!needsClinic && props.clinicId) {
      throw new InvalidRoleAssignmentError(`Role ${props.role} must not belong to a clinic`);
    }
    if (!props.passwordHash && !props.googleId) {
      throw new InvalidRoleAssignmentError("User must have either a password or an OAuth id");
    }

    const now = new Date();
    return new User({
      ...props,
      status: props.status ?? UserStatus.INVITED,
      isEmailVerified: props.isEmailVerified ?? false,
      avatar: props.avatar ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  activate(): void {
    this.props.status = UserStatus.ACTIVE;
    this.touch();
  }

  suspend(): void {
    this.props.status = UserStatus.SUSPENDED;
    this.touch();
  }

  setStatus(status: UserStatus): void {
    this.props.status = status;
    this.touch();
  }

  rename(name: string): void {
    this.props.name = name;
    this.touch();
  }

  verifyEmail(): void {
    this.props.isEmailVerified = true;
    this.touch();
  }

  changePasswordHash(passwordHash: string): void {
    this.props.passwordHash = passwordHash;
    this.touch();
  }

  belongsToClinic(clinicId: string): boolean {
    return this.props.clinicId === clinicId;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get email() { return this.props.email; }
  get passwordHash() { return this.props.passwordHash; }
  get role() { return this.props.role; }
  get status() { return this.props.status; }
  get clinicId() { return this.props.clinicId; }
  get googleId() { return this.props.googleId; }
  get avatar() { return this.props.avatar; }
  get isEmailVerified() { return this.props.isEmailVerified; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  toSafeObject(): Omit<UserProps, "passwordHash"> {
    const { passwordHash, ...rest } = this.props;
    return rest;
  }
}