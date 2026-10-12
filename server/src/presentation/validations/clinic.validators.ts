import { ClinicStatus } from "../../domain/entities/clinic.entity.js";
import { BadRequestError } from "../../shared/errors/index.js";
import { CLINIC_PROFILE_FIELDS } from "../../application/interfaces/clinic.ports.js";
import type { ClinicProfileUpdate, ClinicWorkingHour } from "../../application/interfaces/clinic.ports.js";
import type { RegisterClinicInput } from "../../application/services/clinic-registration.service.js";
import type {
  CreateUploadUrlInput,
  SaveClinicDocumentInput,
} from "../../application/services/clinic-document.service.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const VALID_DAYS = new Set(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
const CLINIC_STATUSES = new Set<string>(Object.values(ClinicStatus));

type Body = Record<string, unknown>;
const asBody = (body: unknown): Body => (body && typeof body === "object" ? (body as Body) : {});

export function parseRegisterClinicBody(raw: unknown): RegisterClinicInput {
  const { name, address, phone, ownerName, email, password, otp } = asBody(raw);

  if (typeof name !== "string" || name.trim().length < 2) {
    throw new BadRequestError("Clinic name is required and must be at least 2 characters long");
  }
  if (typeof ownerName !== "string" || ownerName.trim().length < 2) {
    throw new BadRequestError("Owner name must be at least 2 characters long");
  }
  if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    throw new BadRequestError("A valid owner email address is required");
  }
  if (typeof password !== "string" || password.length < 8) {
    throw new BadRequestError("Password must be at least 8 characters long");
  }
  if (typeof otp !== "string" || otp.trim().length !== 6 || Number.isNaN(Number(otp.trim()))) {
    throw new BadRequestError("A valid OTP is required before submitting the clinic registration.");
  }

  return {
    name: name.trim(),
    address: typeof address === "string" ? address.trim() : null,
    phone: typeof phone === "string" ? phone.trim() : null,
    ownerName: ownerName.trim(),
    email: email.trim().toLowerCase(),
    password,
    otp: otp.trim(),
  };
}

export function parseProfileUpdateBody(raw: unknown): ClinicProfileUpdate {
  const body = asBody(raw);

  if (typeof body.name === "string" && (body.name.trim().length < 2 || body.name.trim().length > 150)) {
    throw new BadRequestError("Clinic name must be between 2 and 150 characters");
  }
  if (typeof body.contactEmail === "string" && !EMAIL_REGEX.test(body.contactEmail.trim())) {
    throw new BadRequestError("Enter a valid clinic contact email address");
  }

  const updates: ClinicProfileUpdate = {};
  for (const field of CLINIC_PROFILE_FIELDS) {
    const value = body[field];
    if (typeof value === "string") {
      updates[field] = field === "contactEmail" ? value.trim().toLowerCase() : value.trim();
    }
  }
  return updates;
}

export function parseSpecializationsBody(raw: unknown): string[] {
  const { specializations } = asBody(raw);
  if (!Array.isArray(specializations)) return [];

  return specializations
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());
}

export function parseWorkingHoursBody(raw: unknown): ClinicWorkingHour[] {
  const { workingHours: entries } = asBody(raw);
  if (!Array.isArray(entries)) return [];

  const workingHours: ClinicWorkingHour[] = entries.map((entry) => {
    const item = asBody(entry);
    return {
      day: String(item.day ?? ""),
      isOpen: Boolean(item.isOpen),
      startTime: String(item.startTime ?? "09:00"),
      endTime: String(item.endTime ?? "17:00"),
    };
  });

  const seenDays = new Set<string>();
  for (const entry of workingHours) {
    if (!VALID_DAYS.has(entry.day) || seenDays.has(entry.day)) {
      throw new BadRequestError("Working hours must contain each valid day no more than once");
    }
    seenDays.add(entry.day);

    const hasInvalidTimes =
      !TIME_REGEX.test(entry.startTime) || !TIME_REGEX.test(entry.endTime) || entry.startTime >= entry.endTime;
    if (entry.isOpen && hasInvalidTimes) {
      throw new BadRequestError(
        `${entry.day}: enter valid 24-hour opening and closing times, with closing later than opening`,
      );
    }
  }

  return workingHours;
}

export function parseUploadUrlBody(raw: unknown): CreateUploadUrlInput {
  const { fileName, contentType, fileSize } = asBody(raw);
  return {
    fileName: typeof fileName === "string" ? fileName.trim() : "",
    contentType: typeof contentType === "string" ? contentType : "",
    fileSize: Number(fileSize),
  };
}

export function parseSaveDocumentBody(raw: unknown): SaveClinicDocumentInput {
  const { documentType, documentKey } = asBody(raw);
  const input = {
    documentType: typeof documentType === "string" ? documentType.trim() : "",
    documentKey: typeof documentKey === "string" ? documentKey.trim() : "",
  };

  if (!input.documentType || !input.documentKey) {
    throw new BadRequestError("Document type and uploaded file are required");
  }
  return input;
}

export function parseClinicStatus(raw: unknown): ClinicStatus {
  const { status } = asBody(raw);
  if (typeof status !== "string" || !CLINIC_STATUSES.has(status)) {
    throw new BadRequestError("Status must be one of: PENDING, APPROVED, REJECTED, BLOCKED");
  }
  return status as ClinicStatus;
}