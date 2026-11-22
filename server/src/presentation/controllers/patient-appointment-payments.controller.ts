import type { NextFunction, Request, Response } from "express";
import type { IPatientAppointmentPaymentsUseCase } from "@application/interfaces/use-cases/patient/IPatientAppointmentPaymentsUseCase.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";
import { ValidationError } from "@shared/errors/index.ts";
import { MESSAGES } from "@shared/constants/messages.constants.ts";

type RawBodyRequest = Request & { rawBody?: Buffer };

export class PatientAppointmentPaymentsController {
  constructor(private readonly payments: IPatientAppointmentPaymentsUseCase) {}

  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.appointmentId;
      if (typeof appointmentId !== "string") throw new ValidationError(MESSAGES.request.appointmentIdRequired);
      ApiResponse.created(res, MESSAGES.response.paymentOrderCreated, await this.payments.createOrder({ appointmentId, patientUserId: req.user!.sub }));
    } catch (error) { next(error); }
  };

  verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.appointmentId;
      if (typeof appointmentId !== "string") throw new ValidationError(MESSAGES.request.appointmentIdRequired);
      ApiResponse.success(res, MESSAGES.response.paymentStatusVerified, await this.payments.verify({
        appointmentId,
        patientUserId: req.user!.sub,
        orderId: req.body?.razorpay_order_id,
        paymentId: req.body?.razorpay_payment_id,
        signature: req.body?.razorpay_signature,
      }));
    } catch (error) { next(error); }
  };

  confirmTestPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.appointmentId;
      if (typeof appointmentId !== "string") throw new ValidationError(MESSAGES.request.appointmentIdRequired);
      ApiResponse.success(res, MESSAGES.response.testPaymentCompleted, await this.payments.confirmTestPayment({ appointmentId, patientUserId: req.user!.sub }));
    } catch (error) { next(error); }
  };

  status = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.appointmentId;
      if (typeof appointmentId !== "string") throw new ValidationError(MESSAGES.request.appointmentIdRequired);
      ApiResponse.success(res, MESSAGES.response.paymentStatusRetrieved, await this.payments.getStatus(appointmentId, req.user!.sub));
    } catch (error) { next(error); }
  };

  webhook = async (req: RawBodyRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!Buffer.isBuffer(req.rawBody)) throw new ValidationError("Raw webhook body is unavailable");
      const signature = req.get("x-razorpay-signature");
      if (!signature) throw new ValidationError(MESSAGES.request.webhookSignatureRequired);
      await this.payments.handleWebhook(req.rawBody, signature, req.get("x-razorpay-event-id") ?? undefined);
      res.status(200).json({ received: true });
    } catch (error) { next(error); }
  };
}

