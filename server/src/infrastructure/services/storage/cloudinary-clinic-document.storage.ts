import type { IClinicDocumentStorage } from "@application/interfaces/services/IClinicDocumentStorage.ts";
import { CloudinaryDocumentStorage } from "@infrastructure/services/storage/cloudinary-document.storage.ts";

export class CloudinaryClinicDocumentStorage extends CloudinaryDocumentStorage implements IClinicDocumentStorage {
  constructor() {
    super("clinic-documents");
  }
}
