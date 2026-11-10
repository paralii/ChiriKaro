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

export interface DoctorBreak {
  day: DoctorDayOfWeek;
  startTime: string;
  endTime: string;
}

export interface DoctorAvailabilitySlot {
  day: DoctorDayOfWeek;
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
  breaks: DoctorBreak[];
  slotDurationMinutes: number;
  bufferTimeMinutes: number;
  verificationStatus: DoctorVerificationStatus;
  rejectionReason: string | null;
  consultationFee: number | null;
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
      breaks: props.breaks ?? [],
      slotDurationMinutes: props.slotDurationMinutes ?? 30,
      bufferTimeMinutes: props.bufferTimeMinutes ?? 0,
      verificationStatus: props.verificationStatus ?? "NOT_STARTED",
      rejectionReason: props.rejectionReason ?? null,
      consultationFee: props.consultationFee ?? null,
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

  configureAvailability(updates: {
    workingHours: DoctorWorkingHour[];
    breaks: DoctorBreak[];
    slotDurationMinutes: number;
    bufferTimeMinutes: number;
  }): void {
    if (!Number.isInteger(updates.slotDurationMinutes) || updates.slotDurationMinutes < 5 || updates.slotDurationMinutes > 240) {
      throw new InvalidDoctorDataError("slotDurationMinutes must be an integer from 5 to 240");
    }
    if (!Number.isInteger(updates.bufferTimeMinutes) || updates.bufferTimeMinutes < 0 || updates.bufferTimeMinutes > 120) {
      throw new InvalidDoctorDataError("bufferTimeMinutes must be an integer from 0 to 120");
    }
    const workingHours = this.normalizeWorkingHours(updates.workingHours);
    const openHours = new Map(workingHours.filter((hours) => hours.isOpen).map((hours) => [hours.day, hours]));
    if (!Array.isArray(updates.breaks)) throw new InvalidDoctorDataError("breaks must be a list");
    const breaks = updates.breaks.map((item) => {
      if (!DAYS.includes(item.day) || !TIME_PATTERN.test(item.startTime) || !TIME_PATTERN.test(item.endTime) || item.startTime >= item.endTime) {
        throw new InvalidDoctorDataError("Break has an invalid day or time range");
      }
      const hours = openHours.get(item.day);
      if (!hours || item.startTime < hours.startTime || item.endTime > hours.endTime) {
        throw new InvalidDoctorDataError(`Break for ${item.day} must be within doctor working hours`);
      }
      return { ...item };
    }).sort((a, b) => a.day.localeCompare(b.day) || a.startTime.localeCompare(b.startTime));
    for (let index = 1; index < breaks.length; index++) {
      if (breaks[index - 1]!.day === breaks[index]!.day && breaks[index - 1]!.endTime > breaks[index]!.startTime) {
        throw new InvalidDoctorDataError("Breaks on the same day must not overlap");
      }
    }
    this.props.workingHours = workingHours;
    this.props.breaks = breaks;
    this.props.slotDurationMinutes = updates.slotDurationMinutes;
    this.props.bufferTimeMinutes = updates.bufferTimeMinutes;
    this.props.updatedAt = new Date();
  }

  generateAvailabilitySlots(): DoctorAvailabilitySlot[] {
    const slots: DoctorAvailabilitySlot[] = [];
    const step = this.props.slotDurationMinutes + this.props.bufferTimeMinutes;
    for (const hours of this.props.workingHours.filter((item) => item.isOpen)) {
      const pauses = this.props.breaks.filter((item) => item.day === hours.day).sort((a, b) => a.startTime.localeCompare(b.startTime));
      const segments: Array<{ startTime: string; endTime: string }> = [];
      let cursor = minutes(hours.startTime);
      for (const pause of pauses) {
        const pauseStart = minutes(pause.startTime);
        if (pauseStart > cursor) segments.push({ startTime: time(cursor), endTime: time(pauseStart) });
        cursor = minutes(pause.endTime);
      }
      const closing = minutes(hours.endTime);
      if (cursor < closing) segments.push({ startTime: time(cursor), endTime: time(closing) });
      for (const segment of segments) {
        const segmentStart = minutes(segment.startTime);
        const segmentEnd = minutes(segment.endTime);
        for (let start = segmentStart; start + this.props.slotDurationMinutes <= segmentEnd; start += step) {
          slots.push({ day: hours.day, startTime: time(start), endTime: time(start + this.props.slotDurationMinutes) });
        }
      }
    }
    return slots;
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

  removeDocument(documentType: string): string {
    this.ensureEditable();
    const document = this.props.documents.find((item) => item.documentType === documentType);
    if (!document) throw new InvalidDoctorDataError("Doctor document was not found");
    this.props.documents = this.props.documents.filter((item) => item.documentType !== documentType);
    this.markInProgress();
    return document.documentKey;
  }

  submitForVerification(): void {
    if (this.props.verificationStatus !== "IN_PROGRESS") {
      throw new InvalidDoctorDataError("Doctor onboarding must be updated before submission");
    }
    if (!this.props.professionalTitle || this.props.qualifications.length === 0 ||
      this.props.yearsOfExperience === null || !this.props.registrationNumber ||
      !this.props.registrationAuthority || this.props.specializations.length === 0 ||
      this.props.workingHours.length === 0 || this.props.documents.length === 0) {
      throw new InvalidDoctorDataError("Complete all professional details and upload documents before submission");
    }
    this.props.verificationStatus = "PENDING_VERIFICATION";
    this.props.rejectionReason = null;
    this.props.documents = this.props.documents.map((document) => ({
      ...document,
      status: "PENDING",
      verifiedAt: null,
      rejectionReason: null,
    }));
    this.props.updatedAt = new Date();
  }

  approveVerification(): void {
    if (this.props.verificationStatus !== "PENDING_VERIFICATION") {
      throw new InvalidDoctorDataError("Only pending doctor profiles can be approved");
    }
    const verifiedAt = new Date();
    this.props.verificationStatus = "VERIFIED";
    this.props.rejectionReason = null;
    this.props.documents = this.props.documents.map((document) => ({
      ...document,
      status: "APPROVED",
      verifiedAt,
      rejectionReason: null,
    }));
    this.props.updatedAt = verifiedAt;
  }

  rejectVerification(reason: string): void {
    if (this.props.verificationStatus !== "PENDING_VERIFICATION") {
      throw new InvalidDoctorDataError("Only pending doctor profiles can be rejected");
    }
    this.props.verificationStatus = "REJECTED";
    this.props.rejectionReason = requiredText(reason, "rejectionReason");
    this.props.updatedAt = new Date();
  }

  updateConsultationFee(fee: number): void {
    if (!Number.isFinite(fee) || fee < 0 || Math.abs(fee * 100 - Math.round(fee * 100)) > 1e-8) {
      throw new InvalidDoctorDataError("Consultation fee must be a non-negative amount with at most two decimal places");
    }
    this.props.consultationFee = Number(fee.toFixed(2));
    this.props.updatedAt = new Date();
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
    if (this.props.verificationStatus !== "NOT_STARTED" && this.props.verificationStatus !== "IN_PROGRESS" && this.props.verificationStatus !== "REJECTED") {
      throw new InvalidDoctorDataError("Doctor onboarding cannot be edited in its current status");
    }
  }

  private markInProgress(): void {
    this.props.verificationStatus = "IN_PROGRESS";
    this.props.rejectionReason = null;
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
  get breaks() { return this.props.breaks.map((item) => ({ ...item })); }
  get slotDurationMinutes() { return this.props.slotDurationMinutes; }
  get bufferTimeMinutes() { return this.props.bufferTimeMinutes; }
  get verificationStatus() { return this.props.verificationStatus; }
  get rejectionReason() { return this.props.rejectionReason; }
  get consultationFee() { return this.props.consultationFee; }
  get documents() { return this.props.documents.map((document) => ({ ...document, uploadedAt: new Date(document.uploadedAt) })); }
  get createdAt() { return new Date(this.props.createdAt); }
  get updatedAt() { return new Date(this.props.updatedAt); }
}

function minutes(value: string): number {
  const [hours, mins] = value.split(":").map(Number);
  return hours! * 60 + mins!;
}

function time(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
