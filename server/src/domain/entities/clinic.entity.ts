import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";
import { InvalidClinicDataError } from "@domain/error/DomainError.ts";
import { ClinicSetupStatus } from "@domain/enum/clinic-setup-status.enum.ts";

export interface ClinicWorkingHour {
  day: string;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

export interface ClinicDocumentData {
  documentType: string;
  documentKey: string;
  uploadedAt: Date;
}

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
  specializations: string[];
  workingHours: ClinicWorkingHour[];
  documents: ClinicDocumentData[];
  setupStatus: ClinicSetupStatus;
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
      | "specializations"
      | "workingHours"
      | "documents"
      | "setupStatus"
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
      specializations: props.specializations ?? [],
      workingHours: props.workingHours ?? [],
      documents: props.documents ?? [],
      setupStatus: props.setupStatus ?? ClinicSetupStatus.IN_PROGRESS,
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

  updateProfile(updates: {
    name?: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    phone?: string | null;
    contactEmail?: string | null;
    registrationNumber?: string | null;
  }): void {
    if (updates.name !== undefined) {
      const name = updates.name.trim();
      if (name.length < MIN_NAME_LENGTH) {
        throw new InvalidClinicDataError(
          `Clinic name must be at least ${MIN_NAME_LENGTH} characters`,
        );
      }
      this.props.name = name;
    }

    if (updates.address !== undefined) {
      this.props.address = optionalTrimmed(updates.address, "address");
    }
    if (updates.city !== undefined) {
      this.props.city = optionalTrimmed(updates.city, "city");
    }
    if (updates.state !== undefined) {
      this.props.state = optionalTrimmed(updates.state, "state");
    }
    if (updates.pincode !== undefined) {
      this.props.pincode = optionalMatching(updates.pincode, "pincode", PINCODE_PATTERN);
    }
    if (updates.phone !== undefined) {
      this.props.phone = optionalMatching(updates.phone, "phone", PHONE_PATTERN);
    }
    if (updates.contactEmail !== undefined) {
      const contactEmail = updates.contactEmail === null
        ? null
        : requireNonBlank(updates.contactEmail, "contactEmail");
      if (contactEmail !== null && !EMAIL_PATTERN.test(contactEmail)) {
        throw new InvalidClinicDataError(
          "Clinic contactEmail is not a valid email address",
        );
      }
      this.props.contactEmail = contactEmail;
    }
    if (updates.registrationNumber !== undefined) {
      this.props.registrationNumber = optionalTrimmed(
        updates.registrationNumber,
        "registrationNumber",
      );
    }

    this.touch();
  }

  updateSpecializations(values: string[]): void {
    if (!Array.isArray(values) || values.length === 0) {
      throw new InvalidClinicDataError("At least one specialization is required");
    }
    const normalized = values.map((value) => requireNonBlank(value, "specialization"));
    this.props.specializations = [...new Set(normalized)];
    this.touch();
  }

  updateWorkingHours(values: ClinicWorkingHour[]): void {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    if (!Array.isArray(values) || values.length !== days.length) {
      throw new InvalidClinicDataError("Working hours must include all seven days");
    }
    const seen = new Set<string>();
    for (const hours of values) {
      if (!days.includes(hours.day) || seen.has(hours.day)) {
        throw new InvalidClinicDataError("Working hours contain an invalid or duplicate day");
      }
      seen.add(hours.day);
      if (typeof hours.isOpen !== "boolean") {
        throw new InvalidClinicDataError("Working hour isOpen must be a boolean");
      }
      if (hours.isOpen && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hours.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hours.endTime) || hours.startTime >= hours.endTime)) {
        throw new InvalidClinicDataError(`Working hours for ${hours.day} are invalid`);
      }
    }
    this.props.workingHours = values.map((hours) => ({ ...hours }));
    this.touch();
  }

  addDocument(document: ClinicDocumentData): void {
    const documentType = requireNonBlank(document.documentType, "documentType");
    const documentKey = requireNonBlank(document.documentKey, "documentKey");
    this.props.documents = [
      ...this.props.documents.filter((item) => item.documentType !== documentType),
      { documentType, documentKey, uploadedAt: new Date(document.uploadedAt) },
    ];
    this.touch();
  }

  submitSetup(): void {
    if (!this.props.address || !this.props.city || !this.props.state || !this.props.pincode) {
      throw new InvalidClinicDataError("Complete clinic location before submitting setup");
    }
    if (this.props.specializations.length === 0) {
      throw new InvalidClinicDataError("Add clinic specializations before submitting setup");
    }
    if (this.props.workingHours.length !== 7) {
      throw new InvalidClinicDataError("Configure working hours before submitting setup");
    }
    if (this.props.documents.length === 0) {
      throw new InvalidClinicDataError("Upload at least one clinic document before submitting setup");
    }
    this.props.setupStatus = ClinicSetupStatus.PENDING_VERIFICATION;
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
  get specializations() { return [...this.props.specializations]; }
  get workingHours() { return this.props.workingHours.map((hours) => ({ ...hours })); }
  get documents() { return this.props.documents.map((document) => ({ ...document, uploadedAt: new Date(document.uploadedAt) })); }
  get setupStatus() { return this.props.setupStatus; }
  get createdAt() {
    return new Date(this.props.createdAt);
  }
  get updatedAt() {
    return new Date(this.props.updatedAt);
  }
}
