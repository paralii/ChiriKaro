import { Types } from "mongoose";
import type { QueryFilter } from "mongoose";
import type { PipelineStage } from "mongoose";
import type { IBillingRepository } from "@application/interfaces/repositories/IBillingRepository.ts";
import type { BillingFilters, BillingScope, BillingSummaryDTO, PageDTO, SettlementDTO, SettlementFilters, TransactionDTO } from "@application/dto/billing/billing.dto.ts";
import { SettlementStatus } from "@domain/enum/settlement-status.enum.ts";
import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";
import { PaymentStatus } from "@domain/enum/payment-status.enum.ts";
import { AppointmentPaymentModel } from "@infrastructure/database/mongodb/models/AppointmentPaymentModel.ts";
import type { IAppointmentPaymentDocument } from "@infrastructure/database/mongodb/models/AppointmentPaymentModel.ts";
import { ClinicModel } from "@infrastructure/database/mongodb/models/ClinicModel.ts";
import { SettlementModel } from "@infrastructure/database/mongodb/models/SettlementModel.ts";
import { BadRequestError, ConflictError, NotFoundError } from "@shared/errors/index.ts";

type PaymentJoin = { _id: Types.ObjectId; appointmentId: Types.ObjectId; amountMinor: number; currency: string; status: string; refundReviewStatus: string; providerPaymentId: string | null; activeSettlementId: Types.ObjectId | null; completedSettlementId: Types.ObjectId | null; createdAt: Date; updatedAt: Date; appointment: { _id: Types.ObjectId; clinicId: Types.ObjectId; doctorUserId: Types.ObjectId; patientUserId: Types.ObjectId; clinicNameSnapshot: string; doctorNameSnapshot: string; startsAt: Date; status: string } };
const pageOf = <T>(items: T[], page: number, limit: number, totalItems: number): PageDTO<T> => ({ items, page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) });
const pipelineStages = (stages: Record<string, unknown>[]): PipelineStage[] => stages as unknown as PipelineStage[];
const toSettlement = (doc: InstanceType<typeof SettlementModel>, clinicName: string): SettlementDTO => ({
  settlementId: doc._id.toString(), clinicId: doc.clinicId.toString(), clinicName,
  allocations: doc.allocations.map((a) => ({ paymentId: a.paymentId.toString(), amountMinor: a.amountMinor })),
  totalAmountMinor: doc.totalAmountMinor, currency: doc.currency, status: doc.status,
  externalPayoutReference: doc.externalPayoutReference, administrativeNote: doc.administrativeNote, failureReason: doc.failureReason,
  createdBy: doc.createdBy.toString(), completedBy: doc.completedBy?.toString() ?? null, failedBy: doc.failedBy?.toString() ?? null,
  createdAt: doc.createdAt.toISOString(), updatedAt: doc.updatedAt.toISOString(), completedAt: doc.completedAt?.toISOString() ?? null, failedAt: doc.failedAt?.toISOString() ?? null,
});
export class BillingRepository implements IBillingRepository {
  async listTransactions(scope: BillingScope, filters: BillingFilters): Promise<PageDTO<TransactionDTO>> {
    const appointmentMatch: Record<string, unknown> = scope.role === "SUPER_ADMIN" ? {} : { clinicId: new Types.ObjectId(scope.clinicId), ...(scope.role === "DOCTOR" ? { doctorUserId: new Types.ObjectId(scope.doctorUserId) } : {}) };
    if (filters.appointmentId) appointmentMatch._id = new Types.ObjectId(filters.appointmentId);
    const paymentMatch: Record<string, unknown> = { ...(filters.status ? { status: filters.status } : {}), ...(filters.from || filters.to ? { createdAt: { ...(filters.from ? { $gte: filters.from } : {}), ...(filters.to ? { $lte: filters.to } : {}) } } : {}) };
    const pipeline: Record<string, unknown>[] = [
      { $match: paymentMatch }, { $lookup: { from: "appointments", localField: "appointmentId", foreignField: "_id", as: "appointment" } }, { $unwind: "$appointment" }, { $match: { "appointment.clinicId": { $exists: true }, ...Object.fromEntries(Object.entries(appointmentMatch).map(([key, value]) => [`appointment.${key}`, value])) } },
      { $sort: { createdAt: -1, _id: -1 } },
    ];
    const countRows = await AppointmentPaymentModel.aggregate<{ total: number }>(pipelineStages([...pipeline, { $count: "total" }])).exec();
    const rows = await AppointmentPaymentModel.aggregate<PaymentJoin>(pipelineStages([...pipeline, { $skip: (filters.page - 1) * filters.limit }, { $limit: filters.limit }, { $project: { _id: 1, appointmentId: 1, amountMinor: 1, currency: 1, status: 1, refundReviewStatus: 1, providerPaymentId: 1, activeSettlementId: 1, completedSettlementId: 1, createdAt: 1, updatedAt: 1, "appointment._id": 1, "appointment.clinicId": 1, "appointment.doctorUserId": 1, "appointment.patientUserId": 1, "appointment.clinicNameSnapshot": 1, "appointment.doctorNameSnapshot": 1, "appointment.startsAt": 1, "appointment.status": 1 } }])).exec();
    let patientNames = new Map<string, string>();
    if (scope.role !== "DOCTOR" && rows.length) {
      const { UserModel } = await import("@infrastructure/database/mongodb/models/UserModel.ts");
      const users = await UserModel.find({ _id: { $in: rows.map((r) => r.appointment.patientUserId) } }).select({ name: 1 }).lean().exec();
      patientNames = new Map(users.map((user) => [user._id.toString(), user.name]));
    }
    const items = rows.map((r): TransactionDTO => ({
      paymentId: r._id.toString(), appointmentId: r.appointmentId.toString(), appointmentDate: r.appointment.startsAt.toISOString(),
      clinicId: r.appointment.clinicId.toString(), clinicName: r.appointment.clinicNameSnapshot, doctorId: r.appointment.doctorUserId.toString(), doctorName: r.appointment.doctorNameSnapshot,
      ...(scope.role !== "DOCTOR" ? { patientId: r.appointment.patientUserId.toString(), patientName: patientNames.get(r.appointment.patientUserId.toString()) ?? "Patient" } : {}),
      amountMinor: r.amountMinor, currency: r.currency, paymentStatus: r.status, refundReviewStatus: r.refundReviewStatus ?? "NOT_REQUIRED",
      razorpayPaymentReference: r.providerPaymentId, settlementEligible: scope.role === "SUPER_ADMIN" && r.status === PaymentStatus.SUCCEEDED && r.appointment.status === "COMPLETED" && r.refundReviewStatus === "NOT_REQUIRED" && !r.activeSettlementId && !r.completedSettlementId,
      createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
    }));
    return pageOf(items, filters.page, filters.limit, countRows[0]?.total ?? 0);
  }
  async getSummary(scope: Exclude<BillingScope, { role: "DOCTOR" }>, from: Date | null, to: Date | null): Promise<BillingSummaryDTO> {
    const clinicId = scope.role === "CLINIC_ADMIN" ? new Types.ObjectId(scope.clinicId) : null;
    const date = from || to ? { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) } : undefined;
    const filter: Record<string, unknown> = { status: "SUCCEEDED", ...(date ? { createdAt: date } : {}) };
    const pipeline: Record<string, unknown>[] = [{ $match: filter }, { $lookup: { from: "appointments", localField: "appointmentId", foreignField: "_id", as: "appointment" } }, { $unwind: "$appointment" }, ...(clinicId ? [{ $match: { "appointment.clinicId": clinicId } }] : []), { $group: { _id: null, gross: { $sum: "$amountMinor" }, count: { $sum: 1 }, reviewAmount: { $sum: { $cond: [{ $eq: ["$refundReviewStatus", "PENDING_REVIEW"] }, "$amountMinor", 0] } }, reviewCount: { $sum: { $cond: [{ $eq: ["$refundReviewStatus", "PENDING_REVIEW"] }, 1, 0] } } } }];
    const [grossRows, pendingRows, completedRows] = await Promise.all([
      AppointmentPaymentModel.aggregate<{ gross: number; count: number; reviewAmount: number; reviewCount: number }>(pipelineStages(pipeline)).exec(),
      SettlementModel.aggregate<{ amount: number; count: number }>([{ $match: { ...(clinicId ? { clinicId } : {}), status: SettlementStatus.PENDING, ...(date ? { createdAt: date } : {}) } }, { $group: { _id: null, amount: { $sum: "$totalAmountMinor" }, count: { $sum: 1 } } }]).exec(),
      SettlementModel.aggregate<{ amount: number; count: number }>([{ $match: { ...(clinicId ? { clinicId } : {}), status: SettlementStatus.COMPLETED, ...(date ? { createdAt: date } : {}) } }, { $group: { _id: null, amount: { $sum: "$totalAmountMinor" }, count: { $sum: 1 } } }]).exec(),
    ]);
    const gross = grossRows[0] ?? { gross: 0, count: 0, reviewAmount: 0, reviewCount: 0 }, pending = pendingRows[0] ?? { amount: 0, count: 0 }, completed = completedRows[0] ?? { amount: 0, count: 0 };
    return { currency: "INR", grossCapturedCollectionsMinor: gross.gross, successfulPaymentCount: gross.count, refundReviewAmountMinor: gross.reviewAmount, refundReviewCount: gross.reviewCount, pendingSettlementAmountMinor: pending.amount, completedSettlementAmountMinor: completed.amount, pendingSettlementCount: pending.count, completedSettlementCount: completed.count };
  }
  async createSettlement(input: { clinicId: string; paymentIds: string[]; createdBy: string; note: string | null }): Promise<SettlementDTO> {
    const clinic = await ClinicModel.findOne({ _id: new Types.ObjectId(input.clinicId), status: ClinicStatus.APPROVED }).select({ name: 1 }).lean().exec();
    if (!clinic) throw new NotFoundError("Approved clinic");
    const ids = input.paymentIds.map((id) => new Types.ObjectId(id));
    const rows = await AppointmentPaymentModel.aggregate<{ _id: Types.ObjectId; amountMinor: number; appointmentId: Types.ObjectId }>(pipelineStages([
      { $match: { _id: { $in: ids }, status: "SUCCEEDED", refundReviewStatus: "NOT_REQUIRED", activeSettlementId: null, completedSettlementId: null } },
      { $lookup: { from: "appointments", localField: "appointmentId", foreignField: "_id", as: "appointment" } }, { $unwind: "$appointment" },
      { $match: { "appointment.clinicId": new Types.ObjectId(input.clinicId), "appointment.status": "COMPLETED" } },
      { $project: { _id: 1, amountMinor: 1, appointmentId: 1 } },
    ])).exec();
    if (rows.length !== ids.length) throw new ConflictError("Every payment must be completed, captured, unallocated, and belong to this clinic");
    const total = rows.reduce((sum, row) => sum + row.amountMinor, 0);
    if (!Number.isSafeInteger(total) || total < 1) throw new BadRequestError("Settlement total is invalid");
    const settlementId = new Types.ObjectId();
    let doc: InstanceType<typeof SettlementModel>;
    try {
      doc = await SettlementModel.create({ _id: settlementId, clinicId: new Types.ObjectId(input.clinicId), allocations: rows.map((r) => ({ paymentId: r._id, amountMinor: r.amountMinor })), totalAmountMinor: total, currency: "INR", status: SettlementStatus.PENDING, allocationsActive: true, createdBy: new Types.ObjectId(input.createdBy), administrativeNote: input.note });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw new ConflictError("One or more payments already belong to an active or completed settlement");
      throw error;
    }
    const reserved: Types.ObjectId[] = [];
    try {
      for (const paymentId of ids) {
        const filter: QueryFilter<IAppointmentPaymentDocument> = { _id: paymentId, status: PaymentStatus.SUCCEEDED, refundReviewStatus: "NOT_REQUIRED", activeSettlementId: null, completedSettlementId: null };
        const claimed = await AppointmentPaymentModel.findOneAndUpdate(filter, { $set: { activeSettlementId: settlementId } }, { returnDocument: "after" }).exec();
        if (!claimed) throw new ConflictError("A payment was allocated by another settlement request");
        reserved.push(paymentId);
      }
    } catch (error) {
      await AppointmentPaymentModel.updateMany({ _id: { $in: reserved }, activeSettlementId: settlementId }, { $set: { activeSettlementId: null } }).exec();
      await SettlementModel.updateOne({ _id: settlementId, status: SettlementStatus.PENDING }, { $set: { status: SettlementStatus.FAILED, allocationsActive: false, failureReason: "Allocation reservation failed because a payment was concurrently reserved", failedBy: new Types.ObjectId(input.createdBy), failedAt: new Date() } }).exec();
      throw error;
    }
    return toSettlement(doc, clinic.name);
  }
  async listSettlements(filters: SettlementFilters): Promise<PageDTO<SettlementDTO>> {
    const query: Record<string, unknown> = { ...(filters.clinicId ? { clinicId: new Types.ObjectId(filters.clinicId) } : {}), ...(filters.status ? { status: filters.status } : {}), ...(filters.from || filters.to ? { createdAt: { ...(filters.from ? { $gte: filters.from } : {}), ...(filters.to ? { $lte: filters.to } : {}) } } : {}) };
    const [docs, totalItems] = await Promise.all([SettlementModel.find(query).sort({ createdAt: -1, _id: -1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit).exec(), SettlementModel.countDocuments(query).exec()]);
    const clinics = await ClinicModel.find({ _id: { $in: docs.map((d) => d.clinicId) } }).select({ name: 1 }).lean().exec();
    const names = new Map(clinics.map((c) => [c._id.toString(), c.name]));
    return pageOf(docs.map((d) => toSettlement(d, names.get(d.clinicId.toString()) ?? "Clinic")), filters.page, filters.limit, totalItems);
  }
  async getSettlement(id: string, clinicId?: string): Promise<SettlementDTO | null> {
    const doc = await SettlementModel.findOne({ _id: new Types.ObjectId(id), ...(clinicId ? { clinicId: new Types.ObjectId(clinicId) } : {}) }).exec();
    if (!doc) return null;
    const clinic = await ClinicModel.findById(doc.clinicId).select({ name: 1 }).lean().exec();
    return toSettlement(doc, clinic?.name ?? "Clinic");
  }
  async transitionSettlement(input: { id: string; actorId: string; status: Exclude<SettlementStatus, "PENDING">; externalPayoutReference: string | null; failureReason: string | null }): Promise<SettlementDTO | null> {
    const now = new Date();
    const update = input.status === SettlementStatus.COMPLETED
      ? { $set: { status: SettlementStatus.COMPLETED, completedBy: new Types.ObjectId(input.actorId), completedAt: now, externalPayoutReference: input.externalPayoutReference } }
      : { $set: { status: SettlementStatus.FAILED, allocationsActive: false, failedBy: new Types.ObjectId(input.actorId), failedAt: now, failureReason: input.failureReason, externalPayoutReference: input.externalPayoutReference } };
    const doc = await SettlementModel.findOneAndUpdate({ _id: input.id, status: SettlementStatus.PENDING }, update, { returnDocument: "after", runValidators: true }).exec();
    if (!doc) return null;
    if (input.status === SettlementStatus.COMPLETED) {
      await AppointmentPaymentModel.updateMany({ activeSettlementId: doc._id }, { $set: { activeSettlementId: null, completedSettlementId: doc._id } }).exec();
    } else {
      await AppointmentPaymentModel.updateMany({ activeSettlementId: doc._id }, { $set: { activeSettlementId: null } }).exec();
    }
    const clinic = await ClinicModel.findById(doc.clinicId).select({ name: 1 }).lean().exec();
    return toSettlement(doc, clinic?.name ?? "Clinic");
  }
}
