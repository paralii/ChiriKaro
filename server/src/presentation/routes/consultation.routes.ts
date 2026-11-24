import express, { Router } from "express";
import type { RequestHandler } from "express";
import type { ConsultationController } from "@presentation/controllers/consultation.controller.ts";
import type { AIAssistanceController } from "@presentation/controllers/ai-assistance.controller.ts";
import { API_ROUTES } from "@shared/constants/apiRoutes.ts";
export function ConsultationRouter(controller: ConsultationController, auth: RequestHandler, doctor: RequestHandler, ai: AIAssistanceController): Router {
  const r = Router();
  r.post(API_ROUTES.DOCTOR.CONSULTATION_OPEN, auth, doctor, controller.open);
  r.get(API_ROUTES.DOCTOR.CONSULTATION_BY_ID, auth, doctor, controller.get);
  r.put(API_ROUTES.DOCTOR.CONSULTATION_BY_ID, auth, doctor, controller.save);
  r.get(API_ROUTES.DOCTOR.CONSULTATION_PATIENT_RECORDS, auth, doctor, controller.history);
  r.get(API_ROUTES.DOCTOR.CONSULTATION_PATIENT_HISTORY, auth, doctor, controller.getMedicalHistory);
  r.put(API_ROUTES.DOCTOR.CONSULTATION_PATIENT_HISTORY, auth, doctor, controller.updateHistory);
  r.post(API_ROUTES.DOCTOR.CONSULTATION_FINALIZE, auth, doctor, controller.finalize);
  r.get(API_ROUTES.DOCTOR.CONSULTATION_PRESCRIPTION_PDF, auth, doctor, controller.doctorPrescriptionPdf);
  r.post(API_ROUTES.DOCTOR.CONSULTATION_ATTACHMENTS, auth, doctor, express.raw({ type: ["application/pdf", "image/jpeg", "image/png"], limit: "10mb" }), controller.upload);
  r.get(API_ROUTES.DOCTOR.CONSULTATION_ATTACHMENT, auth, doctor, controller.readAttachment);
  r.delete(API_ROUTES.DOCTOR.CONSULTATION_ATTACHMENT, auth, doctor, controller.deleteAttachment);
  r.post(API_ROUTES.DOCTOR.CONSULTATION_AI_SYMPTOM_ANALYSIS, auth, doctor, ai.symptomAnalysis);
  r.post(API_ROUTES.DOCTOR.CONSULTATION_AI_PATIENT_BRIEF, auth, doctor, ai.patientBrief);
  r.post(API_ROUTES.DOCTOR.CONSULTATION_AI_INSIGHTS, auth, doctor, ai.insights);
  r.post(API_ROUTES.DOCTOR.CONSULTATION_AI_FRESHNESS, auth, doctor, ai.freshness);
  return r;
}

export function PatientPrescriptionRouter(controller: ConsultationController, auth: RequestHandler, patient: RequestHandler): Router {
  const r = Router();
  r.get(API_ROUTES.PATIENT.PRESCRIPTIONS, auth, patient, controller.patientPrescriptions);
  r.get(API_ROUTES.PATIENT.PRESCRIPTION_PDF, auth, patient, controller.patientPrescriptionPdf);
  return r;
}
