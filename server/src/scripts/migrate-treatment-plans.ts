import { Types } from "mongoose";
import { MongoDatabase } from "@infrastructure/database/mongodb/mongodb.ts";
import { ConsultationModel } from "@infrastructure/database/mongodb/models/ConsultationModel.ts";
import { TreatmentPlanModel } from "@infrastructure/database/mongodb/models/TreatmentPlanModel.ts";

type Result = { scanned: number; migrated: number; skippedEmpty: number; alreadyMigrated: number; failed: Array<{ consultationId: string; error: string }> };
const result: Result = { scanned: 0, migrated: 0, skippedEmpty: 0, alreadyMigrated: 0, failed: [] };
const database = new MongoDatabase();
try {
  await database.connect();
  const cursor = ConsultationModel.find({ "data.treatmentPlan.0": { $exists: true } }).cursor();
  for await (const consultation of cursor) {
    result.scanned += 1;
    try {
      // The consultation ObjectId is a deterministic migration key, making reruns idempotent.
      if (await TreatmentPlanModel.exists({ _id: consultation._id })) { result.alreadyMigrated += 1; continue; }
      const procedures = consultation.data.treatmentPlan;
      if (!procedures.length) { result.skippedEmpty += 1; continue; }
      await TreatmentPlanModel.create({ _id: new Types.ObjectId(consultation._id), clinicId: consultation.clinicId, consultationId: consultation._id, patientUserId: consultation.patientUserId, patientName: consultation.patientNameSnapshot, doctorUserId: consultation.doctorUserId, title: "Existing consultation treatment plan", diagnosis: JSON.stringify(consultation.data.diagnoses), procedures: procedures.map((p) => ({ procedure: p.procedure, affectedTeeth: p.affectedTeeth, estimatedCost: p.estimatedCost, requiredSessions: p.numberOfSessions, instructions: p.instructions })), status: "DRAFT", version: 1, previousVersionId: null, approvalHistory: [] });
      result.migrated += 1;
    } catch (error) { result.failed.push({ consultationId: consultation._id.toString(), error: error instanceof Error ? error.message : String(error) }); }
  }
} finally { await database.disconnect(); }
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (result.failed.length) process.exitCode = 1;
