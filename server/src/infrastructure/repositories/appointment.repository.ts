import { Types } from "mongoose";
import { AppointmentStatus } from "@domain/enum/appointment-status.enum.ts";
import type { AppointmentRecord } from "@domain/entities/booking-workflow.entity.ts";
import type { IAppointmentRepository, AppointmentSlotReservation } from "@application/interfaces/repositories/IAppointmentRepository.ts";
import { AppointmentModel, type IAppointmentDocument } from "@infrastructure/database/mongodb/models/AppointmentModel.ts";
import { AppointmentDayAllocationModel } from "@infrastructure/database/mongodb/models/AppointmentDayAllocationModel.ts";

export class AppointmentRepository implements IAppointmentRepository {
  async findByIdempotencyKey(patientUserId: string, idempotencyKey: string): Promise<AppointmentRecord | null> {
    const doc = await AppointmentModel.findOne({ patientUserId: new Types.ObjectId(patientUserId), idempotencyKey }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async reserveSlot(reservation: AppointmentSlotReservation): Promise<boolean> {
    const allocationId = this.allocationId(reservation.clinicId, reservation.doctorUserId, reservation.localDate);
    try {
      await AppointmentDayAllocationModel.updateOne(
        { _id: allocationId },
        { $setOnInsert: { reservations: [] } },
        { upsert: true },
      ).exec();
    } catch (error) {
      if (!this.isDuplicateKey(error)) throw error;
    }

    try {
      const updated = await AppointmentDayAllocationModel.findOneAndUpdate({
        _id: allocationId,
        reservations: {
          $not: {
            $elemMatch: {
              startsAt: { $lt: reservation.endsAt },
              endsAt: { $gt: reservation.startsAt },
              $or: [
                { status: "CONFIRMED" },
                { status: "PENDING_PAYMENT", holdExpiresAt: { $gt: new Date() } },
              ],
            },
          },
        },
      }, {
        $push: {
          reservations: {
            appointmentId: new Types.ObjectId(reservation.appointmentId),
            patientUserId: new Types.ObjectId(reservation.patientUserId),
            startsAt: reservation.startsAt,
            endsAt: reservation.endsAt,
            holdExpiresAt: reservation.holdExpiresAt,
            status: "PENDING_PAYMENT",
          },
        },
      }, { returnDocument: "after" }).exec();
      return updated !== null;
    } catch (error) {
      if (this.isDuplicateKey(error)) return false;
      throw error;
    }
  }

  async releaseSlot(reservation: AppointmentSlotReservation): Promise<void> {
    const allocationId = this.allocationId(reservation.clinicId, reservation.doctorUserId, reservation.localDate);
    await AppointmentDayAllocationModel.updateOne(
      { _id: allocationId, "reservations.appointmentId": new Types.ObjectId(reservation.appointmentId) },
      { $set: { "reservations.$.status": "RELEASED" } },
    ).exec();
  }

  async create(appointment: AppointmentRecord): Promise<AppointmentRecord> {
    const doc = await AppointmentModel.create({
      _id: new Types.ObjectId(appointment.id),
      patientUserId: new Types.ObjectId(appointment.patientUserId),
      clinicId: new Types.ObjectId(appointment.clinicId),
      doctorUserId: new Types.ObjectId(appointment.doctorUserId),
      clinicNameSnapshot: appointment.clinicNameSnapshot,
      doctorNameSnapshot: appointment.doctorNameSnapshot,
      localDate: appointment.slot.localDate,
      timeZone: appointment.slot.timezone,
      startsAt: appointment.slot.startsAt,
      endsAt: appointment.slot.endsAt,
      localStartTime: appointment.slot.localStartTime,
      localEndTime: appointment.slot.localEndTime,
      feeAmountMinor: appointment.feeSnapshot.amountMinor,
      feeCurrency: appointment.feeSnapshot.currency,
      status: appointment.status,
      idempotencyKey: appointment.idempotencyKey,
      requestFingerprint: appointment.requestFingerprint,
      holdExpiresAt: appointment.holdExpiresAt,
    });
    return this.toDomain(doc);
  }

  async findActiveOverlaps(clinicId: string, doctorUserId: string, localDate: string, startsAt: Date, endsAt: Date, now: Date): Promise<Array<{ startsAt: Date; endsAt: Date }>> {
    const records = await AppointmentModel.find({
      clinicId: new Types.ObjectId(clinicId),
      doctorUserId: new Types.ObjectId(doctorUserId),
      localDate,
      startsAt: { $lt: endsAt },
      endsAt: { $gt: startsAt },
      $or: [
        { status: AppointmentStatus.CONFIRMED },
        { status: AppointmentStatus.PENDING_PAYMENT, holdExpiresAt: { $gt: now } },
      ],
    }).select({ startsAt: 1, endsAt: 1, _id: 0 }).exec();
    const allocation = await AppointmentDayAllocationModel.findById(this.allocationId(clinicId, doctorUserId, localDate)).exec();
    const activeReservations = allocation?.reservations
      .filter((reservation) => reservation.startsAt < endsAt && reservation.endsAt > startsAt &&
        (reservation.status === "CONFIRMED" || (reservation.status === "PENDING_PAYMENT" && reservation.holdExpiresAt > now)))
      .map(({ startsAt: start, endsAt: end }) => ({ startsAt: start, endsAt: end })) ?? [];
    return [
      ...records.map(({ startsAt: start, endsAt: end }) => ({ startsAt: start, endsAt: end })),
      ...activeReservations,
    ];
  }

  async findForPatient(patientUserId: string): Promise<AppointmentRecord[]> {
    const docs = await AppointmentModel.find({ patientUserId: new Types.ObjectId(patientUserId) }).sort({ startsAt: -1, _id: -1 }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findOwnedById(appointmentId: string, patientUserId: string): Promise<AppointmentRecord | null> {
    if (!Types.ObjectId.isValid(appointmentId)) return null;
    const doc = await AppointmentModel.findOne({ _id: new Types.ObjectId(appointmentId), patientUserId: new Types.ObjectId(patientUserId) }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  private allocationId(clinicId: string, doctorUserId: string, localDate: string): string {
    return `${clinicId}:${doctorUserId}:${localDate}`;
  }

  private isDuplicateKey(error: unknown): boolean {
    return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
  }

  private toDomain(doc: IAppointmentDocument): AppointmentRecord {
    return {
      id: doc._id.toString(),
      patientUserId: doc.patientUserId.toString(),
      clinicId: doc.clinicId.toString(),
      doctorUserId: doc.doctorUserId.toString(),
      clinicNameSnapshot: doc.clinicNameSnapshot,
      doctorNameSnapshot: doc.doctorNameSnapshot,
      slot: {
        clinicId: doc.clinicId.toString(),
        doctorUserId: doc.doctorUserId.toString(),
        localDate: doc.localDate,
        timezone: doc.timeZone,
        startsAt: doc.startsAt,
        endsAt: doc.endsAt,
        localStartTime: doc.localStartTime,
        localEndTime: doc.localEndTime,
      },
      feeSnapshot: { amountMinor: doc.feeAmountMinor, currency: doc.feeCurrency },
      status: doc.status,
      idempotencyKey: doc.idempotencyKey,
      requestFingerprint: doc.requestFingerprint,
      holdExpiresAt: doc.holdExpiresAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
