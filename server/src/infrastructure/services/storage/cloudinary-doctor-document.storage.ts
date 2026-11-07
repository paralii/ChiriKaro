import type { IDoctorDocumentStorage } from "@application/interfaces/services/IDoctorDocumentStorage.ts";
import { CloudinaryDocumentStorage } from "@infrastructure/services/storage/cloudinary-document.storage.ts";

export class CloudinaryDoctorDocumentStorage extends CloudinaryDocumentStorage implements IDoctorDocumentStorage {
  constructor() {
    super("doctor-documents");
  }
}
