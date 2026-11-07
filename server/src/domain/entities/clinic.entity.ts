import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";
import { InvalidClinicDataError } from "@domain/error/DomainError.ts";

export interface ClinicProps {
  _id: string | null;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  registrationNumber?: string | null;
  ownerAdminId: string | null;
  status: ClinicStatus;
  createdAt: Date;
  updatedAt: Date;
}

type NewClinicProps = Pick<ClinicProps, "name"> &
  Partial<
    Pick<
      ClinicProps,
      | "_id"
      | "address"
      | "city"
      | "state"
      | "pincode"
      | "phone"
      | "contactEmail"
      | "registrationNumber"
      | "ownerAdminId"
      | "status"
    >
  >;

const MIN_NAME_LENGTH = 2;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;
const PHONE_PATTERN = /^[0-9\s-]{7,15}$/;
const PINCODE_PATTERN = /^\d{6}$/;

function optionalTrimmed(
  value: string | null | undefined,
  field: string,
): string | null {
  if (value == null) return null;
  return requireNonBlank(value, field);
}

function optionalMatching(
  value: string | null | undefined,
  field: string,
  pattern: RegExp,
): string | null {
  const trimmed = optionalTrimmed(value, field);
  if (trimmed !== null && !pattern.test(trimmed)) {
    throw new InvalidClinicDataError(`Clinic ${field} is not valid`);
  }
  return trimmed;
}

function requireNonBlank(
  value: string | null | undefined,
  field: string,
): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new InvalidClinicDataError(`Clinic ${field} must not be blank`);
  }
  return trimmed;
}

export class Clinic {
  private constructor(private props: ClinicProps) {}

  static create(props: NewClinicProps): Clinic {
    const name = props.name?.trim();
    if (!name || name.length < MIN_NAME_LENGTH) {
      throw new InvalidClinicDataError(
        `Clinic name must be at least ${MIN_NAME_LENGTH} characters`,
      );
    }
    const contactEmail =
      props.contactEmail == null
        ? null
        : requireNonBlank(props.contactEmail, "contactEmail");
    if (contactEmail !== null && !EMAIL_PATTERN.test(contactEmail)) {
      throw new InvalidClinicDataError(
        "Clinic contactEmail is not a valid email address",
      );
    }
    const phone = optionalMatching(props.phone, "phone", PHONE_PATTERN);
    const pincode = optionalMatching(props.pincode, "pincode", PINCODE_PATTERN);

    const ownerAdminId =
      props.ownerAdminId == null
        ? null
        : requireNonBlank(props.ownerAdminId, "ownerAdminId");

    const now = new Date();
    const status = props.status ?? ClinicStatus.PENDING;
    return new Clinic({
      _id: props._id ?? null,
      name,
      address: optionalTrimmed(props.address, "address"),
      city: optionalTrimmed(props.city, "city"),
      state: optionalTrimmed(props.state, "state"),
      pincode,
      phone,
      registrationNumber: optionalTrimmed(
        props.registrationNumber,
        "registrationNumber",
      ),
      contactEmail,
      ownerAdminId,
      status,
      createdAt: now,
      updatedAt: new Date(now),
    });
  }

  static fromPersistence(props: ClinicProps): Clinic {
    return new Clinic({
      ...props,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    });
  }

  approve(): void {
    this.props.status = ClinicStatus.APPROVED;
    this.touch();
  }

  reject(): void {
    this.props.status = ClinicStatus.REJECTED;
    this.touch();
  }

  block(): void {
    this.props.status = ClinicStatus.BLOCKED;
    this.touch();
  }

  assignAdmin(adminUserId: string): void {
    this.props.ownerAdminId = requireNonBlank(adminUserId, "ownerAdminId");
    this.touch();
  }

  markPending(): void {
    this.props.status = ClinicStatus.PENDING;
    this.touch();
  }

  deactivate(): void {
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  get id() {
    return this.props._id;
  }
  get name() {
    return this.props.name;
  }
  get address() {
    return this.props.address;
  }
  get city() {
    return this.props.city;
  }
  get state() {
    return this.props.state;
  }
  get pincode() {
    return this.props.pincode;
  }
  get phone() {
    return this.props.phone;
  }
  get registrationNumber() {
    return this.props.registrationNumber;
  }
  get contactEmail() {
    return this.props.contactEmail;
  }
  get ownerAdminId() {
    return this.props.ownerAdminId;
  }
  get status() {
    return this.props.status;
  }
  get createdAt() {
    return new Date(this.props.createdAt);
  }
  get updatedAt() {
    return new Date(this.props.updatedAt);
  }
}
