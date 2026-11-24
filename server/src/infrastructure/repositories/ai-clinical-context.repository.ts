import { Types } from "mongoose";
import type { IAIClinicalContextRepository } from "@application/interfaces/repositories/IAIClinicalContextRepository.ts";
import { ConsultationModel } from "@infrastructure/database/mongodb/models/ConsultationModel.ts";
import { TreatmentPlanModel } from "@infrastructure/database/mongodb/models/TreatmentPlanModel.ts";
import { FollowUpModel } from "@infrastructure/database/mongodb/models/FollowUpModel.ts";

export class AIClinicalContextRepository implements IAIClinicalContextRepository {
  async consultations(patientUserId: string, clinicId: string, excludeConsultationId: string) {
    if (![patientUserId, clinicId].every(Types.ObjectId.isValid) || !Types.ObjectId.isValid(excludeConsultationId)) return [];
    const rows = await ConsultationModel.find({ patientUserId: new Types.ObjectId(patientUserId), clinicId: new Types.ObjectId(clinicId), status: "COMPLETED", _id: { $ne: new Types.ObjectId(excludeConsultationId) } }).sort({ completedAt: -1 }).limit(30).select({ "data.chiefComplaint": 1, "data.symptoms": 1, "data.diagnoses": 1, "data.prescriptions": 1, _id: 0 }).lean().exec();
    return rows.map((row) => ({ data: { chiefComplaint: row.data.chiefComplaint, symptoms: row.data.symptoms, diagnoses: row.data.diagnoses, prescriptions: row.data.prescriptions } }));
  }
  async treatmentPlans(patientUserId: string, clinicId: string, doctorUserId: string) {
    if (![patientUserId, clinicId, doctorUserId].every(Types.ObjectId.isValid)) return [];
    const rows = await TreatmentPlanModel.find({ patientUserId: new Types.ObjectId(patientUserId), clinicId: new Types.ObjectId(clinicId), doctorUserId: new Types.ObjectId(doctorUserId) }).sort({ createdAt: -1 }).limit(30).select({ title: 1, diagnosis: 1, procedures: 1, status: 1, _id: 0 }).lean().exec();
    return rows.map((row) => ({ title: row.title, diagnosis: row.diagnosis, procedures: row.procedures.map((item) => ({ procedure: item.procedure, affectedTeeth: item.affectedTeeth, instructions: item.instructions })), status: row.status }));
  }
  async followUps(patientUserId: string, clinicId: string, doctorUserId: string) {
    if (![patientUserId, clinicId, doctorUserId].every(Types.ObjectId.isValid)) return [];
    const rows = await FollowUpModel.find({ patientUserId: new Types.ObjectId(patientUserId), clinicId: new Types.ObjectId(clinicId), doctorUserId: new Types.ObjectId(doctorUserId) }).sort({ scheduledAt: -1 }).limit(30).select({ reason: 1, notes: 1, status: 1, _id: 0 }).lean().exec();
    return rows.map((row) => ({ reason: row.reason, notes: row.notes, status: row.status }));
  }
}
