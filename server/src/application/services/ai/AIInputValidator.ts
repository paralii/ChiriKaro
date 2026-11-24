import type { ConsultationData, MedicalHistory } from "@domain/entities/consultation.entity.ts";
import { ValidationError } from "@shared/errors/index.ts";

export type SymptomInput = Pick<ConsultationData, "chiefComplaint" | "symptoms" | "painLevel" | "examinationFindings" | "clinicalNotes"> & { medicalHistory: MedicalHistory };
const cleanText = (value: unknown, max = 1200): string => typeof value === "string" ? value.split("").filter((character) => { const code = character.charCodeAt(0); return code >= 32 || code === 9 || code === 10 || code === 13; }).join("").replace(/\s+/g, " ").trim().slice(0, max) : "";

export class AIInputValidator {
  validateSymptomInput(value: unknown, fallbackHistory: MedicalHistory): SymptomInput {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError("Symptom details must be an object");
    const input = value as Record<string, unknown>;
    const allowed = ["chiefComplaint", "symptoms", "painLevel", "examinationFindings", "clinicalNotes", "medicalHistory"];
    if (Object.keys(input).some((key) => !allowed.includes(key))) throw new ValidationError("Symptom details contain unsupported fields");
    for (const key of ["chiefComplaint", "examinationFindings", "clinicalNotes"]) if (input[key] !== undefined && (typeof input[key] !== "string" || input[key].length > 1200)) throw new ValidationError(`${key} must be text of at most 1200 characters`);
    if (input.symptoms !== undefined && (!Array.isArray(input.symptoms) || input.symptoms.length > 30 || input.symptoms.some((item) => typeof item !== "string" || item.length > 300))) throw new ValidationError("Symptoms must be a list of at most 30 text items");
    if (input.painLevel !== undefined && input.painLevel !== null && (typeof input.painLevel !== "number" || input.painLevel < 0 || input.painLevel > 10)) throw new ValidationError("painLevel must be between 0 and 10");
    return {
      chiefComplaint: cleanText(input.chiefComplaint), symptoms: (input.symptoms as string[] | undefined ?? []).map((item) => cleanText(item, 300)),
      painLevel: input.painLevel as number | null ?? null, examinationFindings: cleanText(input.examinationFindings), clinicalNotes: cleanText(input.clinicalNotes),
      medicalHistory: this.validateHistory(input.medicalHistory, fallbackHistory),
    };
  }

  private validateHistory(value: unknown, fallback: MedicalHistory): MedicalHistory {
    if (value === undefined) return fallback;
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError("medicalHistory must be an object");
    const raw = value as Record<string, unknown>;
    const keys = ["existingConditions", "allergies", "medications", "previousSurgeries", "dentalHistory", "remarks"];
    if (Object.keys(raw).some((key) => !keys.includes(key))) throw new ValidationError("medicalHistory contains unsupported fields");
    const lists: Record<string, string[]> = {};
    for (const key of ["existingConditions", "allergies", "medications", "previousSurgeries"]) {
      const items = raw[key] ?? [];
      if (!Array.isArray(items) || items.length > 100 || items.some((item) => typeof item !== "string" || item.length > 300)) throw new ValidationError(`${key} must be a list of at most 100 text items`);
      lists[key] = items.map((item) => cleanText(item, 300));
    }
    for (const key of ["dentalHistory", "remarks"]) if (raw[key] !== undefined && (typeof raw[key] !== "string" || raw[key].length > 1200)) throw new ValidationError(`${key} must be text of at most 1200 characters`);
    return { existingConditions: lists.existingConditions ?? [], allergies: lists.allergies ?? [], medications: lists.medications ?? [], previousSurgeries: lists.previousSurgeries ?? [], dentalHistory: cleanText(raw.dentalHistory), remarks: cleanText(raw.remarks) };
  }
}
