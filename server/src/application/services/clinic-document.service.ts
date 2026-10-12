import { randomUUID } from "node:crypto";
import { BadRequestError, NotFoundError } from "../../shared/errors/index.js";
import type {
  ClinicDocumentRecord,
  IClinicDocumentStorage,
  IClinicProfileRepository,
} from "../interfaces/clinic.ports.js";

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const UPLOAD_URL_TTL_SECONDS = 300;

export interface CreateUploadUrlInput {
  fileName: string;
  contentType: string;
  fileSize: number;
}

export interface SaveClinicDocumentInput {
  documentType: string;
  documentKey: string;
}

export class ClinicDocumentService {
  constructor(
    private readonly profileRepository: IClinicProfileRepository,
    private readonly storage: IClinicDocumentStorage,
  ) {}

  async createUploadUrl(clinicId: string, input: CreateUploadUrlInput) {
    if (!this.storage.isConfigured()) {
      throw new BadRequestError("Document uploads are not configured. Contact your administrator.");
    }
    if (!input.fileName || !Number.isFinite(input.fileSize) || input.fileSize <= 0 || input.fileSize > MAX_DOCUMENT_BYTES) {
      throw new BadRequestError("Choose a document smaller than 10 MB");
    }
    if (!ALLOWED_CONTENT_TYPES.includes(input.contentType)) {
      throw new BadRequestError("Upload a PDF, JPG, or PNG document");
    }

    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
    const key = `${this.keyPrefix(clinicId)}${randomUUID()}-${safeName}`;
    const uploadUrl = await this.storage.createUploadUrl(key, input.contentType);

    return { key, uploadUrl, method: "PUT" as const, expiresInSeconds: UPLOAD_URL_TTL_SECONDS };
  }

  async getDocuments(clinicId: string): Promise<ClinicDocumentRecord[]> {
    const documents = await this.profileRepository.findDocuments(clinicId);
    if (!documents) throw new NotFoundError("Clinic");
    return documents;
  }

  async saveDocument(clinicId: string, input: SaveClinicDocumentInput): Promise<ClinicDocumentRecord[]> {
    if (!input.documentKey.startsWith(this.keyPrefix(clinicId))) {
      throw new BadRequestError("The uploaded document does not belong to this clinic");
    }
    if (!(await this.storage.objectExists(input.documentKey))) {
      throw new BadRequestError("The document upload has not completed. Try uploading it again.");
    }

    const documents = await this.profileRepository.saveDocument(clinicId, {
      documentType: input.documentType,
      documentKey: input.documentKey,
      uploadedAt: new Date(),
    });
    if (!documents) throw new NotFoundError("Clinic");
    return documents;
  }

  async getDownloadUrl(clinicId: string, documentType: string): Promise<string> {
    const documents = await this.profileRepository.findDocuments(clinicId);
    const document = documents?.find((item) => item.documentType === documentType);
    if (!document) throw new NotFoundError("Clinic document");
    return this.storage.createDownloadUrl(document.documentKey);
  }

  private keyPrefix(clinicId: string): string {
    return `clinics/${clinicId}/documents/`;
  }
}