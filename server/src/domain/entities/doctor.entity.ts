import { InvalidDoctorDataError } from "@domain/error/DomainError.ts";

export type DoctorGender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
export type DoctorVerificationStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED";
export type DoctorDayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface DoctorWorkingHour {
  day: DoctorDayOfWeek;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

export interface DoctorDocumentData {
  documentType: string;
  documentKey: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  uploadedAt: Date;
  verifiedAt: Date | null;
  rejectionReason: string | null;
}

export interface DoctorProps {
  id: string | null;
  userId: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  gender: DoctorGender | null;
  dateOfBirth: Date | null;
  professionalTitle: string | null;
  qualifications: string[];
  yearsOfExperience: number | null;
  registrationNumber: string | null;
  registrationAuthority: string | null;
  specializations: string[];
  procedures: string[];
  workingHours: DoctorWorkingHour[];
  verificationStatus: DoctorVerificationStatus;
  documents: DoctorDocumentData[];
  createdAt: Date;
  updatedAt: Date;
}

type NewDoctorProps = Partial<DoctorProps> &
  Pick<DoctorProps, "userId" | "clinicId" | "firstName" | "lastName">;

const DAYS: DoctorDayOfWeek[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function requiredText(value: string, field: string): string {
  const trimmed = value?.trim();
  if (!trimmed) throw new InvalidDoctorDataError(`${field} must not be blank`);
  return trimmed;
}

function optionalText(value: string | null): string | null {
  if (value === null) return null;
  return requiredText(value, "Doctor profile field");
}

function normalizedList(values: string[], field: string): string[] {
  if (!Array.isArray(values)) throw new InvalidDoctorDataError(`${field} must be a list`);
  const normalized = values.map((value) => requiredText(value, field));
  return [...new Set(normalized)];
}

export class Doctor {
  private constructor(private props: DoctorProps) {}

  static create(props: NewDoctorProps): Doctor {
    const now = new Date();
    const doctor = new Doctor({
      id: props.id ?? null,
      userId: requiredText(props.userId, "userId"),
      clinicId: requiredText(props.clinicId, "clinicId"),
      firstName: requiredText(props.firstName, "firstName"),
      lastName: requiredText(props.lastName, "lastName"),
      gender: props.gender ?? null,
      dateOfBirth: props.dateOfBirth ? new Date(props.dateOfBirth) : null,
      professionalTitle: props.professionalTitle ?? null,
      qualifications: props.qualifications ?? [],
      yearsOfExperience: props.yearsOfExperience ?? null,
      registrationNumber: props.registrationNumber ?? null,
      registrationAuthority: props.registrationAuthority ?? null,
      specializations: props.specializations ?? [],
      procedures: props.procedures ?? [],
      workingHours: props.workingHours ?? [],
      verificationStatus: props.verificationStatus ?? "NOT_STARTED",
      documents: (props.documents ?? []).map((document) => ({ ...document })),
      createdAt: props.createdAt ? new Date(props.createdAt) : now,
      updatedAt: props.updatedAt ? new Date(props.updatedAt) : new Date(now),
    });
    doctor.validateIdentity();
    return doctor;
  }

  static fromPersistence(props: DoctorProps): Doctor {
    return Doctor.create(props);
  }

  updateBasicInformation(updates: {
    firstName?: string;
    lastName?: string;
    gender?: DoctorGender | null;
    dateOfBirth?: Date | null;
  }): void {
    this.ensureEditable();
    if (updates.firstName !== undefined) this.props.firstName = requiredText(updates.firstName, "firstName");
    if (updates.lastName !== undefined) this.props.lastName = requiredText(updates.lastName, "lastName");
    if (updates.gender !== undefined) this.props.gender = updates.gender;
    if (updates.dateOfBirth !== undefined) {
      if (updates.dateOfBirth && (Number.isNaN(updates.dateOfBirth.getTime()) || updates.dateOfBirth > new Date())) {
        throw new InvalidDoctorDataError("dateOfBirth must be a valid past date");
      }
      this.props.dateOfBirth = updates.dateOfBirth;
    }
    this.markInProgress();
  }

  updateProfessionalInformation(updates: {
    professionalTitle?: string | null;
    qualifications?: string[];
    yearsOfExperience?: number | null;
    registrationNumber?: string | null;
    registrationAuthority?: string | null;
  }): void {
    this.ensureEditable();
    if (updates.professionalTitle !== undefined) this.props.professionalTitle = optionalText(updates.professionalTitle);
    if (updates.qualifications !== undefined) this.props.qualifications = normalizedList(updates.qualifications, "qualification");
    if (updates.yearsOfExperience !== undefined) {
      const years = updates.yearsOfExperience;
      if (years !== null && (!Number.isInteger(years) || years < 0 || years > 80)) {
        throw new InvalidDoctorDataError("yearsOfExperience must be an integer from 0 to 80");
      }
      this.props.yearsOfExperience = years;
    }
    if (updates.registrationNumber !== undefined) this.props.registrationNumber = optionalText(updates.registrationNumber);
    if (updates.registrationAuthority !== undefined) this.props.registrationAuthority = optionalText(updates.registrationAuthority);
    this.markInProgress();
  }

  updatePracticeInformation(updates: {
    specializations?: string[];
    procedures?: string[];
    workingHours?: DoctorWorkingHour[];
  }): void {
    this.ensureEditable();
    if (updates.specializations !== undefined) this.props.specializations = normalizedList(updates.specializations, "specialization");
    if (updates.procedures !== undefined) this.props.procedures = normalizedList(updates.procedures, "procedure");
    if (updates.workingHours !== undefined) this.props.workingHours = this.normalizeWorkingHours(updates.workingHours);
    this.markInProgress();
  }

  addDocument(document: DoctorDocumentData): void {
    this.ensureEditable();
    const documentType = requiredText(document.documentType, "documentType");
    const documentKey = requiredText(document.documentKey, "documentKey");
    this.props.documents = [
      ...this.props.documents.filter((item) => item.documentType !== documentType),
      { ...document, documentType, documentKey, uploadedAt: new Date(document.uploadedAt) },
    ];
    this.markInProgress();
  }

  private normalizeWorkingHours(values: DoctorWorkingHour[]): DoctorWorkingHour[] {
    if (!Array.isArray(values)) throw new InvalidDoctorDataError("workingHours must be a list");
    const seen = new Set<string>();
    return values.map((hours) => {
      if (!DAYS.includes(hours.day) || seen.has(hours.day)) {
        throw new InvalidDoctorDataError("workingHours contains an invalid or duplicate day");
      }
      seen.add(hours.day);
      if (typeof hours.isOpen !== "boolean") throw new InvalidDoctorDataError("isOpen must be a boolean");
      if (!TIME_PATTERN.test(hours.startTime) || !TIME_PATTERN.test(hours.endTime) || (hours.isOpen && hours.startTime >= hours.endTime)) {
        throw new InvalidDoctorDataError(`workingHours for ${hours.day} is invalid`);
      }
      return { ...hours };
    });
  }

  private validateIdentity(): void {
    this.props.firstName = requiredText(this.props.firstName, "firstName");
    this.props.lastName = requiredText(this.props.lastName, "lastName");
    if (this.props.dateOfBirth && (Number.isNaN(this.props.dateOfBirth.getTime()) || this.props.dateOfBirth > new Date())) {
      throw new InvalidDoctorDataError("dateOfBirth must be a valid past date");
    }
  }

  private ensureEditable(): void {
    if (this.props.verificationStatus !== "NOT_STARTED" && this.props.verificationStatus !== "IN_PROGRESS") {
      throw new InvalidDoctorDataError("Doctor onboarding cannot be edited in its current status");
    }
  }

  private markInProgress(): void {
    this.props.verificationStatus = "IN_PROGRESS";
    this.props.updatedAt = new Date();
  }

  get id() { return this.props.id; }
  get userId() { return this.props.userId; }
  get clinicId() { return this.props.clinicId; }
  get firstName() { return this.props.firstName; }
  get lastName() { return this.props.lastName; }
  get gender() { return this.props.gender; }
  get dateOfBirth() { return this.props.dateOfBirth ? new Date(this.props.dateOfBirth) : null; }
  get professionalTitle() { return this.props.professionalTitle; }
  get qualifications() { return [...this.props.qualifications]; }
  get yearsOfExperience() { return this.props.yearsOfExperience; }
  get registrationNumber() { return this.props.registrationNumber; }
  get registrationAuthority() { return this.props.registrationAuthority; }
  get specializations() { return [...this.props.specializations]; }
  get procedures() { return [...this.props.procedures]; }
  get workingHours() { return this.props.workingHours.map((hours) => ({ ...hours })); }
  get verificationStatus() { return this.props.verificationStatus; }
  get documents() { return this.props.documents.map((document) => ({ ...document, uploadedAt: new Date(document.uploadedAt) })); }
  get createdAt() { return new Date(this.props.createdAt); }
  get updatedAt() { return new Date(this.props.updatedAt); }
}
