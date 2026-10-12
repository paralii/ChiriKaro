export enum ClinicStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  BLOCKED = "BLOCKED",
}

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

export class Clinic {
  private constructor(private props: ClinicProps) {}

  static create(props: NewClinicProps): Clinic {
    if (!props.name || props.name.trim().length < 2) {
      throw new Error("Clinic name must be at least 2 characters");
    }
    const now = new Date();
    const status = props.status ?? ClinicStatus.PENDING;
    return new Clinic({
      ...props,
      address: props.address ?? null,
      phone: props.phone ?? null,
      ownerName: props.ownerName ?? null,
      contactEmail: props.contactEmail ?? null,
      ownerAdminId: props.ownerAdminId ?? null,
      status,
      isActive: status === ClinicStatus.APPROVED,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ClinicProps): Clinic {
    return new Clinic(props);
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

  /** Called once the invited CLINIC_ADMIN accepts and registers. */
  assignAdmin(adminUserId: string): void {
    this.props.ownerAdminId = adminUserId;
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
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}