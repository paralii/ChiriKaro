import { Types } from "mongoose";
import type { AnalyticsDTO, AnalyticsRequest, AnalyticsScope } from "@application/dto/dashboard/analytics.dto.ts";
import type { IAnalyticsRepository } from "@application/interfaces/repositories/IAnalyticsRepository.ts";
import { AppointmentModel } from "@infrastructure/database/mongodb/models/AppointmentModel.ts";
import { AppointmentPaymentModel } from "@infrastructure/database/mongodb/models/AppointmentPaymentModel.ts";
import { ClinicModel } from "@infrastructure/database/mongodb/models/ClinicModel.ts";
import { ConsultationModel } from "@infrastructure/database/mongodb/models/ConsultationModel.ts";
import { DentistModel } from "@infrastructure/database/mongodb/models/DentistModel.ts";
import { QueueEntryModel } from "@infrastructure/database/mongodb/models/QueueEntryModel.ts";
import { UserModel } from "@infrastructure/database/mongodb/models/UserModel.ts";

type Count = { _id: string | null; count: number };
type Trend = { _id: Date; count: number; amountMinor?: number };
const zeroStatuses = (rows: Count[], keys: string[]) => keys.map((status) => ({ status, count: rows.find((row) => row._id === status)?.count ?? 0 }));

export class AnalyticsRepository implements IAnalyticsRepository {
  async getAnalytics(scope: AnalyticsScope, request: AnalyticsRequest): Promise<AnalyticsDTO> {
    const now = request.now ?? new Date();
    const days = request.range === "7d" ? 7 : request.range === "30d" ? 30 : request.range === "90d" ? 90 : null;
    const from = days ? new Date(now.getTime() - days * 86400000) : null;
    const clinicId = scope.role === "SUPER_ADMIN" ? undefined : new Types.ObjectId(scope.clinicId);
    const doctorId = scope.role === "DOCTOR" ? new Types.ObjectId(scope.doctorUserId) : undefined;
    const timezone = scope.role === "SUPER_ADMIN" ? "UTC" : (await ClinicModel.findById(clinicId).select("timeZone").lean().exec())?.timeZone ?? "UTC";
    const granularity = request.range === "all" || request.range === "90d" ? "month" : request.range === "30d" ? "week" : "day";
    const dateMatch = (field: string): Record<string, unknown> => from ? { [field]: { $gte: from, $lte: now } } : { [field]: { $lte: now } };
    const appointmentScope: Record<string, unknown> = { ...(clinicId ? { clinicId } : {}), ...(doctorId ? { doctorUserId: doctorId } : {}) };
    const consultationScope: Record<string, unknown> = { ...(clinicId ? { clinicId } : {}), ...(doctorId ? { doctorUserId: doctorId } : {}), status: "COMPLETED" };
    const queueScope: Record<string, unknown> = { ...(clinicId ? { clinicId } : {}), ...(doctorId ? { doctorUserId: doctorId } : {}), status: { $in: ["WAITING", "IN_CONSULTATION"] } };
    const userScope: Record<string, unknown> = { role: "PATIENT", ...(clinicId ? { clinicId } : {}) };
    const [appointmentTotal, appointmentStatuses, appointmentTrend, consultationTotal, consultationTrend, paymentStatuses, paymentSummary, paymentTrend, queueCounts, patientTrend, doctorStatusRows, clinicStatusRows, doctorTotal, clinicTotal, newClinicTrend, newDoctorTrend] = await Promise.all([
      AppointmentModel.countDocuments({ ...appointmentScope, ...dateMatch("createdAt") }).exec(),
      AppointmentModel.aggregate<Count>([{ $match: { ...appointmentScope, ...dateMatch("createdAt") } }, { $group: { _id: "$status", count: { $sum: 1 } } }]).exec(),
      AppointmentModel.aggregate<Trend>([{ $match: { ...appointmentScope, ...dateMatch("createdAt") } }, { $group: { _id: { $dateTrunc: { date: "$createdAt", unit: granularity, timezone } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]).exec(),
      ConsultationModel.countDocuments({ ...consultationScope, ...dateMatch("completedAt") }).exec(),
      ConsultationModel.aggregate<Trend>([{ $match: { ...consultationScope, ...dateMatch("completedAt") } }, { $group: { _id: { $dateTrunc: { date: "$completedAt", unit: granularity, timezone } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]).exec(),
      AppointmentPaymentModel.aggregate<Count>([
        { $lookup: { from: "appointments", localField: "appointmentId", foreignField: "_id", as: "appointment" } }, { $unwind: "$appointment" },
        { $match: { ...dateMatch("createdAt"), ...(clinicId ? { "appointment.clinicId": clinicId } : {}), ...(doctorId ? { "appointment.doctorUserId": doctorId } : {}) } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]).exec(),
      AppointmentPaymentModel.aggregate<{ count: number; amountMinor: number }>([
        { $lookup: { from: "appointments", localField: "appointmentId", foreignField: "_id", as: "appointment" } }, { $unwind: "$appointment" },
        { $match: { status: "SUCCEEDED", ...dateMatch("createdAt"), ...(clinicId ? { "appointment.clinicId": clinicId } : {}), ...(doctorId ? { "appointment.doctorUserId": doctorId } : {}) } },
        { $group: { _id: null, count: { $sum: 1 }, amountMinor: { $sum: "$amountMinor" } } },
      ]).exec(),
      AppointmentPaymentModel.aggregate<Trend>([
        { $lookup: { from: "appointments", localField: "appointmentId", foreignField: "_id", as: "appointment" } }, { $unwind: "$appointment" },
        { $match: { status: "SUCCEEDED", ...dateMatch("createdAt"), ...(clinicId ? { "appointment.clinicId": clinicId } : {}), ...(doctorId ? { "appointment.doctorUserId": doctorId } : {}) } },
        { $group: { _id: { $dateTrunc: { date: "$createdAt", unit: granularity, timezone } }, count: { $sum: 1 }, amountMinor: { $sum: "$amountMinor" } } }, { $sort: { _id: 1 } },
      ]).exec(),
      QueueEntryModel.aggregate<Count>([{ $match: queueScope }, { $group: { _id: "$status", count: { $sum: 1 } } }]).exec(),
      UserModel.aggregate<Trend>([{ $match: { ...userScope, ...dateMatch("createdAt") } }, { $group: { _id: { $dateTrunc: { date: "$createdAt", unit: granularity, timezone } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]).exec(),
      scope.role === "DOCTOR" ? Promise.resolve([] as Count[]) : DentistModel.aggregate<Count>([{ $match: clinicId ? { clinicId } : {} }, { $group: { _id: "$verificationStatus", count: { $sum: 1 } } }]).exec(),
      scope.role === "SUPER_ADMIN" ? ClinicModel.aggregate<Count>([{ $group: { _id: "$status", count: { $sum: 1 } } }]).exec() : Promise.resolve([] as Count[]),
      scope.role === "DOCTOR" ? Promise.resolve(1) : scope.role === "CLINIC_ADMIN" ? DentistModel.countDocuments({ clinicId: clinicId! }).exec() : UserModel.countDocuments({ role: "DOCTOR" }).exec(),
      scope.role === "SUPER_ADMIN" ? ClinicModel.countDocuments().exec() : Promise.resolve(1),
      scope.role === "SUPER_ADMIN" ? ClinicModel.aggregate<Trend>([{ $match: dateMatch("createdAt") }, { $group: { _id: { $dateTrunc: { date: "$createdAt", unit: granularity, timezone } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]).exec() : Promise.resolve([] as Trend[]),
      (scope.role === "SUPER_ADMIN" ? UserModel.aggregate<Trend>([{ $match: { role: "DOCTOR", ...dateMatch("createdAt") } }, { $group: { _id: { $dateTrunc: { date: "$createdAt", unit: granularity, timezone } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]).exec() : Promise.resolve([] as Trend[])),
    ]);
    const [doctorRegistered, clinicAppointmentRows, doctorAppointmentRows, appointmentPatientIds, consultationPatientIds, periodAppointmentPatients, periodConsultationPatients] = await Promise.all([
      scope.role === "SUPER_ADMIN" ? UserModel.countDocuments({ role: "DOCTOR" }).exec() : Promise.resolve(doctorTotal),
      scope.role === "SUPER_ADMIN" ? this.clinicRankings(from, now) : Promise.resolve([]),
      scope.role === "CLINIC_ADMIN" || scope.role === "SUPER_ADMIN" ? this.doctorRankings(clinicId ?? null, from, now) : Promise.resolve([]),
      clinicId ? AppointmentModel.distinct("patientUserId", appointmentScope).exec() : Promise.resolve([]),
      clinicId ? ConsultationModel.distinct("patientUserId", { ...consultationScope, patientUserId: { $ne: null } }).exec() : Promise.resolve([]),
      clinicId ? AppointmentModel.distinct("patientUserId", { ...appointmentScope, ...dateMatch("createdAt") }).exec() : Promise.resolve([]),
      clinicId ? ConsultationModel.distinct("patientUserId", { clinicId, ...(doctorId ? { doctorUserId: doctorId } : {}), patientUserId: { $ne: null }, ...dateMatch("createdAt") }).exec() : Promise.resolve([]),
    ]);
    const distinctScopedPatients = new Set([...appointmentPatientIds, ...consultationPatientIds].filter(Boolean).map((id) => id.toString())).size;
    const periodActivePatients = new Set([...periodAppointmentPatients, ...periodConsultationPatients].filter(Boolean).map((id) => id.toString())).size;
    const clinicRankings = scope.role === "SUPER_ADMIN" ? clinicAppointmentRows : [];
    const doctorRankings = scope.role === "CLINIC_ADMIN" || scope.role === "SUPER_ADMIN" ? doctorAppointmentRows : [];
    const doctorVerification = zeroStatuses(doctorStatusRows, ["NOT_STARTED", "IN_PROGRESS", "PENDING_VERIFICATION", "VERIFIED", "REJECTED"]);
    const clinicStatuses = zeroStatuses(clinicStatusRows, ["PENDING", "APPROVED", "REJECTED", "BLOCKED"]);
    const succeeded = paymentSummary[0] ?? { count: 0, amountMinor: 0 };
    const [lifetimeAppointments, lifetimeConsultations, lifetimePayments] = await Promise.all([
      AppointmentModel.countDocuments(appointmentScope).exec(),
      ConsultationModel.countDocuments(consultationScope).exec(),
      AppointmentPaymentModel.aggregate<{ count: number; amountMinor: number }>([
        { $lookup: { from: "appointments", localField: "appointmentId", foreignField: "_id", as: "appointment" } }, { $unwind: "$appointment" },
        { $match: { status: "SUCCEEDED", ...(clinicId ? { "appointment.clinicId": clinicId } : {}), ...(doctorId ? { "appointment.doctorUserId": doctorId } : {}) } },
        { $group: { _id: null, count: { $sum: 1 }, amountMinor: { $sum: "$amountMinor" } } },
      ]).exec(),
    ]);
    const lifetimePayment = lifetimePayments[0] ?? { count: 0, amountMinor: 0 };
    const [appointmentActivity, consultationActivity] = await Promise.all([
      AppointmentModel.aggregate<{ _id: { doctor: Types.ObjectId; date: Date }; count: number }>([
        { $match: { ...appointmentScope, ...dateMatch("createdAt") } },
        { $group: { _id: { doctor: "$doctorUserId", date: { $dateTrunc: { date: "$createdAt", unit: granularity, timezone } } }, count: { $sum: 1 } } },
      ]).exec(),
      ConsultationModel.aggregate<{ _id: { doctor: Types.ObjectId; date: Date }; count: number }>([
        { $match: { ...consultationScope, ...dateMatch("completedAt") } },
        { $group: { _id: { doctor: "$doctorUserId", date: { $dateTrunc: { date: "$completedAt", unit: granularity, timezone } } }, count: { $sum: 1 } } },
      ]).exec(),
    ]);
    const doctorNames = new Map(doctorRankings.map((doctor) => [doctor.doctorUserId, doctor.name]));
    const activityByKey = new Map<string, { doctorUserId: string; name: string; date: string; appointments: number; consultations: number }>();
    for (const row of appointmentActivity) {
      const doctorUserId = row._id.doctor.toString(); const date = row._id.date.toISOString(); const key = `${doctorUserId}:${date}`;
      activityByKey.set(key, { doctorUserId, name: doctorNames.get(doctorUserId) ?? "Doctor", date, appointments: row.count, consultations: 0 });
    }
    for (const row of consultationActivity) {
      const doctorUserId = row._id.doctor.toString(); const date = row._id.date.toISOString(); const key = `${doctorUserId}:${date}`;
      const entry = activityByKey.get(key) ?? { doctorUserId, name: doctorNames.get(doctorUserId) ?? "Doctor", date, appointments: 0, consultations: 0 };
      entry.consultations = row.count; activityByKey.set(key, entry);
    }
    const queues = zeroStatuses(queueCounts, ["WAITING", "IN_CONSULTATION"]);
    const appointmentDistribution = zeroStatuses(appointmentStatuses, ["PENDING_PAYMENT", "CONFIRMED", "CANCELLED", "COMPLETED"]);
    const paymentDistribution = zeroStatuses(paymentStatuses, ["PENDING", "SUCCEEDED", "FAILED", "CANCELLED", "REFUNDED"]);
    const trends = {
      clinics: newClinicTrend.map((row) => ({ date: row._id.toISOString(), count: row.count })),
      doctors: newDoctorTrend.map((row) => ({ date: row._id.toISOString(), count: row.count })),
      patients: patientTrend.map((row) => ({ date: row._id.toISOString(), count: row.count })),
      appointments: appointmentTrend.map((row) => ({ date: row._id.toISOString(), count: row.count })),
      consultations: consultationTrend.map((row) => ({ date: row._id.toISOString(), count: row.count })),
      revenue: paymentTrend.map((row) => ({ date: row._id.toISOString(), count: row.count, amountMinor: row.amountMinor ?? 0 })),
    };
    return {
      range: { key: request.range, from: from?.toISOString() ?? null, to: now.toISOString(), timezone, granularity },
      summary: {
        totalClinics: clinicTotal, activeClinics: scope.role === "SUPER_ADMIN" ? clinicStatuses.find((x) => x.status === "APPROVED")!.count : 1,
        inactiveClinics: scope.role === "SUPER_ADMIN" ? clinicStatuses.filter((x) => ["PENDING", "REJECTED", "BLOCKED"].includes(x.status)).reduce((a, x) => a + x.count, 0) : 0,
        totalDoctors: doctorRegistered, verifiedDoctors: doctorVerification.find((x) => x.status === "VERIFIED")!.count,
        pendingDoctorVerifications: doctorVerification.find((x) => x.status === "PENDING_VERIFICATION")!.count,
        rejectedDoctors: doctorVerification.find((x) => x.status === "REJECTED")!.count,
        totalPatients: scope.role === "SUPER_ADMIN" ? await UserModel.countDocuments({ role: "PATIENT" }).exec() : distinctScopedPatients,
        totalAppointments: appointmentTotal, finalizedConsultations: consultationTotal,
        cancelledAppointments: appointmentDistribution.find((x) => x.status === "CANCELLED")!.count,
        pendingAppointments: appointmentDistribution.find((x) => x.status === "PENDING_PAYMENT")!.count,
        successfulPaymentAmountMinor: succeeded.amountMinor, successfulPaymentCount: succeeded.count,
        pendingPaymentCount: paymentDistribution.find((x) => x.status === "PENDING")!.count,
        failedPaymentCount: paymentDistribution.find((x) => x.status === "FAILED")!.count,
        refundedPaymentCount: paymentDistribution.find((x) => x.status === "REFUNDED")!.count,
        activePatients: periodActivePatients,
        waitingQueueCount: queues.find((x) => x.status === "WAITING")!.count,
        inProgressQueueCount: queues.find((x) => x.status === "IN_CONSULTATION")!.count,
        totalTeamDoctors: doctorTotal,
        ...(scope.role === "SUPER_ADMIN" ? { totalClinics: clinicTotal, totalDoctors: doctorRegistered, totalPatients: await UserModel.countDocuments({ role: "PATIENT" }).exec() } : {}),
      },
      totals: {
        clinics: scope.role === "SUPER_ADMIN" ? clinicTotal : 1,
        activeClinics: scope.role === "SUPER_ADMIN" ? clinicStatuses.find((x) => x.status === "APPROVED")!.count : 1,
        inactiveClinics: scope.role === "SUPER_ADMIN" ? clinicStatuses.filter((x) => ["PENDING", "REJECTED", "BLOCKED"].includes(x.status)).reduce((a, x) => a + x.count, 0) : 0,
        doctors: doctorRegistered,
        verifiedDoctors: doctorVerification.find((x) => x.status === "VERIFIED")!.count,
        pendingDoctorVerifications: doctorVerification.find((x) => x.status === "PENDING_VERIFICATION")!.count,
        rejectedDoctors: doctorVerification.find((x) => x.status === "REJECTED")!.count,
        patients: scope.role === "SUPER_ADMIN" ? await UserModel.countDocuments({ role: "PATIENT" }).exec() : distinctScopedPatients,
        appointments: lifetimeAppointments,
        finalizedConsultations: lifetimeConsultations,
        successfulPaymentCount: lifetimePayment.count,
        successfulPaymentAmountMinor: lifetimePayment.amountMinor,
      },
      period: {
        appointments: appointmentTotal,
        finalizedConsultations: consultationTotal,
        cancelledAppointments: appointmentDistribution.find((x) => x.status === "CANCELLED")!.count,
        pendingAppointments: appointmentDistribution.find((x) => x.status === "PENDING_PAYMENT")!.count,
        successfulPaymentAmountMinor: succeeded.amountMinor,
        successfulPaymentCount: succeeded.count,
        pendingPaymentCount: paymentDistribution.find((x) => x.status === "PENDING")!.count,
        failedPaymentCount: paymentDistribution.find((x) => x.status === "FAILED")!.count,
        refundedPaymentCount: paymentDistribution.find((x) => x.status === "REFUNDED")!.count,
      },
      operational: { waitingQueueCount: queues.find((x) => x.status === "WAITING")!.count, inProgressQueueCount: queues.find((x) => x.status === "IN_CONSULTATION")!.count },
      distributions: { appointments: appointmentDistribution, payments: paymentDistribution, doctors: doctorVerification, clinics: clinicStatuses },
      trends, clinicRankings, doctorRankings,
      doctorActivity: [...activityByKey.values()].sort((a, b) => a.date.localeCompare(b.date) || a.doctorUserId.localeCompare(b.doctorUserId)),
      doctorDistribution: scope.role === "SUPER_ADMIN" ? await DentistModel.aggregate<{ _id: Types.ObjectId; count: number }>([{ $group: { _id: "$clinicId", count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }, { $limit: 100 }]).then((rows) => rows.map((x) => ({ clinicId: x._id.toString(), count: x.count }))) : [],
    };
  }

  private async clinicRankings(from: Date | null, to: Date) {
    const date = from ? { $gte: from, $lte: to } : { $lte: to };
    const rows = await AppointmentModel.aggregate<{ _id: Types.ObjectId; appointments: number; consultations: number; revenueMinor: number }>([
      { $match: { createdAt: date } },
      { $group: { _id: "$clinicId", appointments: { $sum: 1 } } },
      { $lookup: { from: "consultations", let: { clinic: "$_id" }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$clinicId", "$$clinic"] }, { $eq: ["$status", "COMPLETED"] }, { $gte: ["$completedAt", from ?? new Date(0)] }, { $lte: ["$completedAt", to] }] } } }, { $count: "count" }], as: "consultationRows" } },
      { $lookup: { from: "clinics", localField: "_id", foreignField: "_id", as: "clinic" } },
      { $lookup: { from: "appointmentpayments", let: { clinic: "$_id" }, pipeline: [{ $lookup: { from: "appointments", localField: "appointmentId", foreignField: "_id", as: "appointment" } }, { $unwind: "$appointment" }, { $match: { status: "SUCCEEDED", createdAt: date, $expr: { $eq: ["$appointment.clinicId", "$$clinic"] } } }, { $group: { _id: null, amount: { $sum: "$amountMinor" } } }], as: "revenueRows" } },
      { $project: { _id: 1, name: { $ifNull: [{ $arrayElemAt: ["$clinic.name", 0] }, "Clinic"] }, appointments: 1, consultations: { $ifNull: [{ $arrayElemAt: ["$consultationRows.count", 0] }, 0] }, revenueMinor: { $ifNull: [{ $arrayElemAt: ["$revenueRows.amount", 0] }, 0] } } },
      { $sort: { appointments: -1, _id: 1 } }, { $limit: 100 },
    ]).exec();
    return rows.map((row) => ({ clinicId: row._id.toString(), name: (row as typeof row & { name: string }).name, appointments: row.appointments, consultations: row.consultations, revenueMinor: row.revenueMinor }));
  }

  private async doctorRankings(clinicId: Types.ObjectId | null, from: Date | null, to: Date) {
    const date = from ? { $gte: from, $lte: to } : { $lte: to };
    const rows = await AppointmentModel.aggregate<{ _id: Types.ObjectId; name: string; appointments: number; consultations: number }>([
      { $match: { ...(clinicId ? { clinicId } : {}), createdAt: date } }, { $group: { _id: "$doctorUserId", appointments: { $sum: 1 }, clinicId: { $first: "$clinicId" } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $lookup: { from: "consultations", let: { doctor: "$_id", clinic: "$clinicId" }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$doctorUserId", "$$doctor"] }, { $eq: ["$clinicId", "$$clinic"] }, { $eq: ["$status", "COMPLETED"] }, { $gte: ["$completedAt", from ?? new Date(0)] }, { $lte: ["$completedAt", to] }] } } }, { $count: "count" }], as: "consultationRows" } },
      { $project: { _id: 1, name: { $ifNull: [{ $arrayElemAt: ["$user.name", 0] }, "Doctor"] }, appointments: 1, consultations: { $ifNull: [{ $arrayElemAt: ["$consultationRows.count", 0] }, 0] } } },
      { $sort: { appointments: -1, _id: 1 } }, { $limit: 100 },
    ]).exec();
    return rows.map((x) => ({ doctorUserId: x._id.toString(), name: x.name, appointments: x.appointments, consultations: x.consultations }));
  }
}
