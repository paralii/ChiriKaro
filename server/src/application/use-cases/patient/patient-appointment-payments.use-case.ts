import { Types } from "mongoose";
import { AppointmentStatus } from "@domain/enum/appointment-status.enum.ts";
import { PaymentStatus } from "@domain/enum/payment-status.enum.ts";
import { AppointmentModel } from "@infrastructure/database/mongodb/models/AppointmentModel.ts";
import { AppointmentDayAllocationModel } from "@infrastructure/database/mongodb/models/AppointmentDayAllocationModel.ts";
import { AppointmentPaymentModel } from "@infrastructure/database/mongodb/models/AppointmentPaymentModel.ts";
import { RazorpayService } from "@infrastructure/services/razorpay.service.ts";
import type { IPatientAppointmentPaymentsUseCase, PaymentOrderDTO, PaymentStatusDTO } from "@application/interfaces/use-cases/patient/IPatientAppointmentPaymentsUseCase.ts";
import { BadRequestError, ConflictError, NotFoundError, ValidationError } from "@shared/errors/index.ts";

export class PatientAppointmentPaymentsUseCase implements IPatientAppointmentPaymentsUseCase {
  constructor(private readonly razorpay: RazorpayService) {}

  async createOrder(input: { appointmentId: string; patientUserId: string }): Promise<PaymentOrderDTO> {
    const { appointment, patientObjectId } = await this.loadOwnedAppointment(input.appointmentId, input.patientUserId);
    if (appointment.status !== AppointmentStatus.PENDING_PAYMENT || appointment.holdExpiresAt <= new Date()) throw new ConflictError("The appointment payment hold has expired or is no longer payable");
    let payment = await AppointmentPaymentModel.findOne({ appointmentId: appointment._id }).exec();
    if (payment?.providerOrderId) return this.orderDTO(appointment._id.toString(), payment.providerOrderId, payment.amountMinor, payment.currency, payment.status);
    if (payment) throw new ConflictError("Payment order creation is already in progress");
    try {
      payment = await AppointmentPaymentModel.create({ appointmentId: appointment._id, patientUserId: patientObjectId, amountMinor: appointment.feeAmountMinor, currency: appointment.feeCurrency, status: PaymentStatus.PENDING });
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      const existing = await AppointmentPaymentModel.findOne({ appointmentId: appointment._id }).exec();
      if (existing?.providerOrderId) return this.orderDTO(appointment._id.toString(), existing.providerOrderId, existing.amountMinor, existing.currency, existing.status);
      throw new ConflictError("Payment order creation is already in progress");
    }
    try {
      const order = await this.razorpay.createOrder(payment.amountMinor, payment.currency, appointment._id.toString());
      payment.providerOrderId = order.id;
      await payment.save();
      return this.orderDTO(appointment._id.toString(), order.id, payment.amountMinor, payment.currency, payment.status);
    } catch (error) {
      await AppointmentPaymentModel.deleteOne({ _id: payment._id, providerOrderId: null }).exec();
      throw error;
    }
  }

  async verify(input: { appointmentId: string; patientUserId: string; orderId: unknown; paymentId: unknown; signature: unknown }): Promise<PaymentStatusDTO> {
    const { appointment } = await this.loadOwnedAppointment(input.appointmentId, input.patientUserId);
    const payload = this.razorpay.assertCheckoutPayload(input.orderId, input.paymentId, input.signature);
    const record = await AppointmentPaymentModel.findOne({ appointmentId: appointment._id, patientUserId: appointment.patientUserId }).exec();
    if (!record || record.providerOrderId !== payload.orderId) throw new BadRequestError("Payment order does not match this appointment");
    if (record.status === PaymentStatus.SUCCEEDED) return this.statusDTO(appointment._id.toString(), record.status, appointment.status);
    if (!this.razorpay.verifyCheckoutSignature(payload.orderId, payload.paymentId, payload.signature)) throw new BadRequestError("Payment signature is invalid");
    const providerPayment = await this.razorpay.fetchPayment(payload.paymentId);
    if (providerPayment.order_id !== payload.orderId || providerPayment.amount !== record.amountMinor || providerPayment.currency !== record.currency) throw new BadRequestError("Payment details do not match the server order");
    if (providerPayment.status !== "captured" || !providerPayment.captured) return this.statusDTO(appointment._id.toString(), record.status, appointment.status);
    await this.recordCaptured(record, appointment, payload.paymentId);
    return this.getStatus(appointment._id.toString(), input.patientUserId);
  }

  async handleWebhook(rawBody: Buffer, signature: string, eventId?: string): Promise<void> {
    if (!this.razorpay.verifyWebhookSignature(rawBody, signature)) throw new BadRequestError("Webhook signature is invalid");
    let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; currency?: string } } } };
    try { event = JSON.parse(rawBody.toString("utf8")) as typeof event; } catch { throw new ValidationError("Webhook payload is invalid"); }
    const entity = event.payload?.payment?.entity;
    if (!entity?.id || !entity.order_id) return;
    const record = await AppointmentPaymentModel.findOne({ providerOrderId: entity.order_id }).exec();
    if (!record || record.status === PaymentStatus.SUCCEEDED) return;
    if (entity.amount !== record.amountMinor || entity.currency !== record.currency) throw new BadRequestError("Webhook payment does not match the server order");
    if (event.event === "payment.failed") {
      await AppointmentPaymentModel.updateOne({ _id: record._id, status: { $ne: PaymentStatus.SUCCEEDED } }, { $set: { status: PaymentStatus.FAILED, providerPaymentId: entity.id, ...(eventId ? { lastWebhookEventId: eventId } : {}) } }).exec();
      return;
    }
    if (event.event !== "payment.captured") return;
    const appointment = await AppointmentModel.findById(record.appointmentId).exec();
    if (!appointment) throw new NotFoundError("Appointment");
    await this.recordCaptured(record, appointment, entity.id, eventId);
  }

  async getStatus(appointmentId: string, patientUserId: string): Promise<PaymentStatusDTO> {
    const { appointment } = await this.loadOwnedAppointment(appointmentId, patientUserId);
    const payment = await AppointmentPaymentModel.findOne({ appointmentId: appointment._id, patientUserId: appointment.patientUserId }).exec();
    return this.statusDTO(appointment._id.toString(), payment?.status ?? PaymentStatus.PENDING, appointment.status, payment?.refundReviewStatus);
  }

  private async recordCaptured(payment: InstanceType<typeof AppointmentPaymentModel>, appointment: InstanceType<typeof AppointmentModel>, providerPaymentId: string, eventId?: string): Promise<void> {
    const now = new Date();
    const confirmed = await AppointmentModel.findOneAndUpdate({ _id: appointment._id, status: AppointmentStatus.PENDING_PAYMENT, holdExpiresAt: { $gt: now } }, { $set: { status: AppointmentStatus.CONFIRMED } }, { returnDocument: "after" }).exec();
    await AppointmentPaymentModel.updateOne({ _id: payment._id, status: { $ne: PaymentStatus.SUCCEEDED } }, { $set: { status: PaymentStatus.SUCCEEDED, providerPaymentId, ...(eventId ? { lastWebhookEventId: eventId } : {}) } }).exec();
    // Re-read after recording capture: cancellation can race both the initial appointment read
    // and the conditional confirmation above. A captured payment for a cancelled or expired
    // hold must remain visible for manual refund reconciliation.
    const latestAppointment = await AppointmentModel.findById(appointment._id).select({ status: 1, holdExpiresAt: 1 }).exec();
    if (latestAppointment?.status === AppointmentStatus.CANCELLED ||
      (latestAppointment?.status === AppointmentStatus.PENDING_PAYMENT && latestAppointment.holdExpiresAt <= now)) {
      await AppointmentPaymentModel.updateOne({ _id: payment._id, status: PaymentStatus.SUCCEEDED }, { $set: { refundReviewStatus: "PENDING_REVIEW" } }).exec();
    }
    if (!confirmed) return; // Late captured payment remains recorded for reconciliation, without confirming an expired or reallocated slot.
    const allocationId = `${appointment.clinicId.toString()}:${appointment.doctorUserId.toString()}:${appointment.localDate}`;
    await AppointmentDayAllocationModel.updateOne({ _id: allocationId, "reservations.appointmentId": appointment._id, "reservations.status": "PENDING_PAYMENT" }, { $set: { "reservations.$.status": "CONFIRMED" } }).exec();
  }

  private async loadOwnedAppointment(appointmentId: string, patientUserId: string) {
    if (!Types.ObjectId.isValid(appointmentId) || !Types.ObjectId.isValid(patientUserId)) throw new BadRequestError("Appointment or patient identity is invalid");
    const patientObjectId = new Types.ObjectId(patientUserId);
    const appointment = await AppointmentModel.findOne({ _id: new Types.ObjectId(appointmentId), patientUserId: patientObjectId }).exec();
    if (!appointment) throw new NotFoundError("Appointment");
    return { appointment, patientObjectId };
  }

  private orderDTO(appointmentId: string, orderId: string, amountMinor: number, currency: string, status: string): PaymentOrderDTO {
    return { appointmentId, orderId, amountMinor, currency, keyId: this.razorpay.getPublicKeyId(), status };
  }

  private statusDTO(appointmentId: string, paymentStatus: string, appointmentStatus: string, refundReviewStatus?: "NOT_REQUIRED" | "PENDING_REVIEW"): PaymentStatusDTO {
    return { appointmentId, paymentStatus, appointmentStatus, ...(refundReviewStatus ? { refundReviewStatus } : {}) };
  }
}
