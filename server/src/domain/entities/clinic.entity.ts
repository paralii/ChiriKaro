import { ClinicStatus } from "../../shared/enums/clinic-status.enum.ts";
import { InvalidClinicDataError } from "../../shared/errors/DomainError.ts";

export interface ClinicProps {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  ownerName?: string | null;
  contactEmail?: string | null;
  ownerAdminId: string | null;
  status: ClinicStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type NewClinicProps = Pick<ClinicProps, "id" | "name"> &
  Partial<Pick<ClinicProps, "address" | "phone" | "ownerName" | "contactEmail" | "ownerAdminId" | "status">>;

  const MIN_NAME_LENGTH = 2;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;
  
  function requireNonBlank(value: string | null | undefined, field: string): string {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new InvalidClinicDataError(`Clinic ${field} must not be blank`);
    }
    return trimmed;
  }
 
export class Clinic {
  private constructor(private props: ClinicProps) {}

  static create(props: NewClinicProps): Clinic {
    const id = requireNonBlank(props.id, "id");
    const name = props.name?.trim();
    if (!name || name.length < MIN_NAME_LENGTH) {
      throw new InvalidClinicDataError(`Clinic name must be at least ${MIN_NAME_LENGTH} characters`);
    }
    const contactEmail =
      props.contactEmail == null ? null : requireNonBlank(props.contactEmail, "contactEmail");
    if (contactEmail !== null && !EMAIL_PATTERN.test(contactEmail)) {
      throw new InvalidClinicDataError("Clinic contactEmail is not a valid email address");
    }
    const ownerAdminId =
      props.ownerAdminId == null ? null : requireNonBlank(props.ownerAdminId, "ownerAdminId");
 
    const now = new Date();
    const status = props.status ?? ClinicStatus.PENDING;
    return new Clinic({
      id,
      name,
      address: props.address ?? null,
      phone: props.phone ?? null,
      ownerName: props.ownerName ?? null,
      contactEmail,
      ownerAdminId,
      status,
      isActive: status === ClinicStatus.APPROVED,
      createdAt: now,
      updatedAt: new Date(now),
    });
  }

  static fromPersistence(props: ClinicProps): Clinic {
    if (props.isActive && props.status !== ClinicStatus.APPROVED) {
      throw new InvalidClinicDataError(
        `Clinic ${props.id} is active but has status ${props.status}`,
      );
    }
    return new Clinic({
      ...props,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    });
  }

  approve(): void {
    this.props.status = ClinicStatus.APPROVED;
    this.props.isActive = true;
    this.touch();
  }

  reject(): void {
    this.props.status = ClinicStatus.REJECTED;
    this.props.isActive = false;
    this.touch();
  }

  block(): void {
    this.props.status = ClinicStatus.BLOCKED;
    this.props.isActive = false;
    this.touch();
  }

  assignAdmin(adminUserId: string): void {
    this.props.ownerAdminId = requireNonBlank(adminUserId, "ownerAdminId");
    this.touch();
  }

  markPending(): void {
    this.props.status = ClinicStatus.PENDING;
    this.props.isActive = false;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get address() { return this.props.address; }
  get phone() { return this.props.phone; }
  get ownerName() { return this.props.ownerName; }
  get contactEmail() { return this.props.contactEmail; }
  get ownerAdminId() { return this.props.ownerAdminId; }
  get status() { return this.props.status; }
  get isActive() { return this.props.isActive; }
  get createdAt() { return new Date(this.props.createdAt); }
  get updatedAt() { return new Date(this.props.updatedAt); }
}