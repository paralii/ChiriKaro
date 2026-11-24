import { Types } from "mongoose";
import type { IDocumentStorage } from "@application/interfaces/services/IDocumentStorage.ts";
import { PatientHealthRecordModel, type PatientHealthRecordCategory } from "@infrastructure/database/mongodb/models/PatientHealthRecordModel.ts";
import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";

const CATEGORIES = ["DENTAL_X_RAYS", "MEDICAL_REPORTS", "DENTAL_REPORTS", "PRESCRIPTIONS", "LAB_REPORTS", "PREVIOUS_TREATMENT_RECORDS", "OTHER_DOCUMENTS"] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
export type PatientHealthRecordView = { id: string; category: PatientHealthRecordCategory | null; fileName: string; contentType: string; fileSize: number; uploadedAt: Date };
const safeName = (value: string) => { let decoded = value; try { decoded = decodeURIComponent(value); } catch { /* Keep malformed filename text for safe normalization. */ } return [...decoded.trim()].map((character) => character.charCodeAt(0) < 32 || /[\\/]/.test(character) ? "_" : character).join("").slice(0, 180); };

export class PatientHealthRecordUseCase {
  constructor(private readonly storage: IDocumentStorage) {}

  async list(patientUserId: string): Promise<PatientHealthRecordView[]> {
    if (!Types.ObjectId.isValid(patientUserId)) throw new BadRequestError("Patient identity is invalid");
    const records = await PatientHealthRecordModel.find({ patientUserId: new Types.ObjectId(patientUserId) }).sort({ uploadedAt: -1 }).exec();
    return records.map(({ _id, patientUserId: _patientId, documentKey: _key, ...record }) => { void _patientId; void _key; return { ...record, id: _id.toString() }; });
  }

  async upload(patientUserId: string, fileName: string, contentType: string, content: Buffer, category: unknown): Promise<PatientHealthRecordView> {
    if (!Types.ObjectId.isValid(patientUserId)) throw new BadRequestError("Patient identity is invalid");
    if (!content.length || content.length > MAX_FILE_SIZE) throw new ValidationError("Document must be between 1 byte and 10 MB");
    if (!new Set(["application/pdf", "image/jpeg", "image/png"]).has(contentType)) throw new ValidationError("Documents must be PDF, JPEG, or PNG files");
    const name = safeName(fileName);
    if (!name) throw new ValidationError("A file name is required");
    if (category !== undefined && category !== "" && !CATEGORIES.includes(category as PatientHealthRecordCategory)) throw new ValidationError("Health record category is invalid");
    const documentKey = await this.storage.save(content, contentType);
    try {
      const record = await PatientHealthRecordModel.create({ patientUserId: new Types.ObjectId(patientUserId), category: category ? category as PatientHealthRecordCategory : null, fileName: name, contentType, documentKey, fileSize: content.length, uploadedAt: new Date() });
      return { id: record._id.toString(), category: record.category, fileName: record.fileName, contentType: record.contentType, fileSize: record.fileSize, uploadedAt: record.uploadedAt };
    } catch (error) {
      await this.storage.delete(documentKey);
      throw error;
    }
  }

  async read(patientUserId: string, recordId: string) {
    if (!Types.ObjectId.isValid(patientUserId) || !Types.ObjectId.isValid(recordId)) throw new NotFoundError("Health record");
    const record = await PatientHealthRecordModel.findOne({ _id: new Types.ObjectId(recordId), patientUserId: new Types.ObjectId(patientUserId) }).exec();
    if (!record) throw new NotFoundError("Health record");
    const file = await this.storage.read(record.documentKey);
    return { ...file, fileName: record.fileName };
  }
}
