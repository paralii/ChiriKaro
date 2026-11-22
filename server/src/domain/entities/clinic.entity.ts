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

export interface ClinicReviewDecision {
  decision: "APPROVED" | "REJECTED";
  reason: string | null;
  reviewerId: string | null;
  reviewedAt: Date;
}

export interface ClinicProps {
  _id: string | null;
  name: string;
  clinicType: string | null;
  description: string | null;
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
  timeZone: string;
  documents: ClinicDocumentData[];
  setupStatus: ClinicSetupStatus;
  reviewHistory: ClinicReviewDecision[];
  createdAt: Date;
  updatedAt: Date;
}

type NewClinicProps = Pick<ClinicProps, "name"> &
  Partial<
    Pick<
      ClinicProps,
      | "_id"
      | "address"
      | "clinicType"
      | "description"
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
      | "timeZone"
      | "documents"
      | "setupStatus"
      | "reviewHistory"
    >
  >;

const MIN_NAME_LENGTH = 2;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PINCODE_PATTERN = /^\d{6}$/;

function boundedText(value: string | null | undefined, field: string, max: number, required: boolean): string | null {
  if (value == null || (typeof value === "string" && !value.trim() && !required)) return null;
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length > max) throw new InvalidClinicDataError(`${field} must be ${required ? "1 to " : "at most "}${max} characters`);
  return trimmed;
}

function normalizePhone(value: string | null | undefined): string | null {
  if (value == null || !value.trim()) return null;
  const trimmed = value.trim();
  if (!/^\+?[0-9 ()-]+$/.test(trimmed)) throw new InvalidClinicDataError("Phone must contain only digits and common phone separators");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) throw new InvalidClinicDataError("Phone must contain 7 to 15 digits");
  return `${trimmed.startsWith("+") ? "+" : ""}${digits}`;
}

function optionalMatching(
  value: string | null | undefined,
  field: string,
  pattern: RegExp,
): string | null {
  const trimmed = value == null || !value.trim() ? null : value.trim();
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
    if (!name || name.length < MIN_NAME_LENGTH || name.length > 150) {
      throw new InvalidClinicDataError(
        `Clinic name must be between ${MIN_NAME_LENGTH} and 150 characters`,
      );
    }
    const contactEmail =
      props.contactEmail == null
        ? null
        : requireNonBlank(props.contactEmail, "contactEmail");
    if (contactEmail !== null && (contactEmail.length > 254 || !EMAIL_PATTERN.test(contactEmail))) {
      throw new InvalidClinicDataError(
        "Clinic contactEmail is not a valid email address",
      );
    }
    const phone = normalizePhone(props.phone);
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
      clinicType: boundedText(props.clinicType, "Clinic type", 100, false),
      description: boundedText(props.description, "Clinic description", 500, false),
      address: boundedText(props.address, "Address", 250, false),
      city: boundedText(props.city, "City", 100, false),
      state: boundedText(props.state, "State", 100, false),
      pincode,
      phone,
      registrationNumber: boundedText(props.registrationNumber, "Registration number", 100, false),
      contactEmail: contactEmail?.toLowerCase() ?? null,
      ownerAdminId,
      status,
      specializations: props.specializations ?? [],
      workingHours: props.workingHours ?? [],
      timeZone: props.timeZone ?? "Asia/Kolkata",
      documents: props.documents ?? [],
      setupStatus: props.setupStatus ?? ClinicSetupStatus.IN_PROGRESS,
      reviewHistory: (props.reviewHistory ?? []).map((entry) => ({ ...entry, reviewedAt: new Date(entry.reviewedAt) })),
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

  approve(reviewerId: string | null = null): void {
    this.props.status = ClinicStatus.APPROVED;
    this.props.setupStatus = ClinicSetupStatus.VERIFIED;
    this.props.reviewHistory.push({ decision: "APPROVED", reason: null, reviewerId, reviewedAt: new Date() });
    this.touch();
  }

  reject(reason: string, reviewerId: string | null = null): void {
    const normalizedReason = reason.trim();
    if (!normalizedReason || normalizedReason.length > 1000) throw new InvalidClinicDataError("A rejection reason of 1 to 1000 characters is required");
    this.props.status = ClinicStatus.REJECTED;
    this.props.setupStatus = ClinicSetupStatus.REJECTED;
    this.props.reviewHistory.push({ decision: "REJECTED", reason: normalizedReason, reviewerId, reviewedAt: new Date() });
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
    clinicType?: string | null;
    description?: string | null;
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
      if (name.length < MIN_NAME_LENGTH || name.length > 150) {
        throw new InvalidClinicDataError(
          `Clinic name must be between ${MIN_NAME_LENGTH} and 150 characters`,
        );
      }
      this.props.name = name;
    }

    if (updates.clinicType !== undefined) this.props.clinicType = boundedText(updates.clinicType, "Clinic type", 100, false);
    if (updates.description !== undefined) this.props.description = boundedText(updates.description, "Clinic description", 500, false);

    if (updates.address !== undefined) {
      this.props.address = boundedText(updates.address, "Address", 250, false);
    }
    if (updates.city !== undefined) {
      this.props.city = boundedText(updates.city, "City", 100, false);
    }
    if (updates.state !== undefined) {
      this.props.state = boundedText(updates.state, "State", 100, false);
    }
    if (updates.pincode !== undefined) {
      this.props.pincode = optionalMatching(updates.pincode, "pincode", PINCODE_PATTERN);
    }
    if (updates.phone !== undefined) {
      this.props.phone = normalizePhone(updates.phone);
    }
    if (updates.contactEmail !== undefined) {
      const contactEmail = updates.contactEmail === null
        ? null
        : requireNonBlank(updates.contactEmail, "contactEmail");
      if (contactEmail !== null && (contactEmail.length > 254 || !EMAIL_PATTERN.test(contactEmail))) {
        throw new InvalidClinicDataError(
          "Clinic contactEmail is not a valid email address",
        );
      }
      this.props.contactEmail = contactEmail?.toLowerCase() ?? null;
    }
    if (updates.registrationNumber !== undefined) {
      this.props.registrationNumber = boundedText(updates.registrationNumber, "Registration number", 100, false);
    }

    this.touch();
  }

  updateSpecializations(values: string[]): void {
    if (!Array.isArray(values) || values.length === 0) {
      throw new InvalidClinicDataError("At least one specialization is required");
    }
    if (values.length > 20) throw new InvalidClinicDataError("A clinic can have at most 20 specializations");
    const normalized = values.map((value) => {
      const item = requireNonBlank(value, "specialization");
      if (item.length > 100) throw new InvalidClinicDataError("Each specialization must be 100 characters or fewer");
      return item;
    });
    const keys = normalized.map((value) => value.toLocaleLowerCase());
    if (new Set(keys).size !== keys.length) {
      throw new InvalidClinicDataError("Specializations must not contain duplicates");
    }
    this.props.specializations = normalized;
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

  updateTimeZone(value: string): void {
    const timeZone = value.trim();
    try {
      new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    } catch {
      throw new InvalidClinicDataError("Clinic timezone must be a valid IANA timezone");
    }
    this.props.timeZone = timeZone;
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
    if (this.props.status === ClinicStatus.REJECTED) this.props.status = ClinicStatus.PENDING;
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
  get clinicType() { return this.props.clinicType; }
  get description() { return this.props.description; }
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
  get timeZone() { return this.props.timeZone; }
  get documents() { return this.props.documents.map((document) => ({ ...document, uploadedAt: new Date(document.uploadedAt) })); }
  get setupStatus() { return this.props.setupStatus; }
  get reviewHistory() { return this.props.reviewHistory.map((entry) => ({ ...entry, reviewedAt: new Date(entry.reviewedAt) })); }
  get createdAt() {
    return new Date(this.props.createdAt);
  }
  get updatedAt() {
    return new Date(this.props.updatedAt);
  }
}
