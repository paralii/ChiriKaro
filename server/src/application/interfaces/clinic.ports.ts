import type { Clinic } from "../../domain/entities/clinic.entity.js";
import type { User } from "../../domain/entities/user.entity.js";

/* ----------------------------- Core ports ------------------------------ */

export interface IClinicRepository {
  findById(id: string): Promise<Clinic | null | undefined>;
  findAll(): Promise<Clinic[]>;
  save(clinic: Clinic): Promise<Clinic>;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null | undefined>;
  findById(id: string): Promise<User | null | undefined>;
  save(user: User): Promise<User>;
  deleteById(id: string): Promise<unknown>;
}

export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
}

export interface ICachePort {
  get<T>(key: string): Promise<T | null | undefined>;
  del(key: string): Promise<unknown>;
}

export interface ILogger {
  error(message: string): void;
}

export type IdGenerator = () => string;

export interface IRegistrationOtpVerifier {
  verify(email: string, otp: string): Promise<void>;
}

/* ------------------------- Clinic profile read/write ------------------- */

export const CLINIC_PROFILE_FIELDS = [
  "name",
  "description",
  "address",
  "city",
  "state",
  "pincode",
  "phone",
  "contactEmail",
  "registrationNumber",
  "clinicType",
  "logoUrl",
] as const;

export type ClinicProfileField = (typeof CLINIC_PROFILE_FIELDS)[number];
export type ClinicProfileUpdate = Partial<Record<ClinicProfileField, string>>;

export interface ClinicWorkingHour {
  day: string;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

export interface ClinicDocumentRecord {
  documentType: string;
  documentKey: string;
  uploadedAt: Date;
}

export interface ClinicProfile {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  ownerName: string | null;
  contactEmail: string | null;
  registrationNumber: string | null;
  clinicType: string | null;
  logoUrl: string | null;
  status: string;
  isActive: boolean;
  specializations: string[];
  workingHours: ClinicWorkingHour[];
  documents: ClinicDocumentRecord[];
}

export interface IClinicProfileRepository {
  findProfileById(clinicId: string): Promise<ClinicProfile | null>;
  updateProfile(clinicId: string, updates: ClinicProfileUpdate): Promise<ClinicProfile | null>;
  updateSpecializations(clinicId: string, specializations: string[]): Promise<string[] | null>;
  updateWorkingHours(clinicId: string, workingHours: ClinicWorkingHour[]): Promise<ClinicWorkingHour[] | null>;
  findDocuments(clinicId: string): Promise<ClinicDocumentRecord[] | null>;
  saveDocument(clinicId: string, document: ClinicDocumentRecord): Promise<ClinicDocumentRecord[] | null>;
}

/* ---------------------------- Document storage ------------------------- */

export interface IClinicDocumentStorage {
  isConfigured(): boolean;
  createUploadUrl(key: string, contentType: string): Promise<string>;
  createDownloadUrl(key: string): Promise<string>;
  objectExists(key: string): Promise<boolean>;
}