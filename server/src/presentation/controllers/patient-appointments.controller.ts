import type { NextFunction, Request, Response } from "express";
import type { IPatientAppointmentsUseCase } from "@application/interfaces/use-cases/patient/IPatientAppointmentsUseCase.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";
import { ValidationError } from "@shared/errors/index.ts";
import { MESSAGES } from "@shared/constants/messages.constants.ts";

export class PatientAppointmentsController {
  constructor(private readonly _appointmentsUseCase: IPatientAppointmentsUseCase) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointment = await this._appointmentsUseCase.create({
        patientUserId: req.user!.sub,
        listingId: req.body?.listingId,
        date: req.body?.date,
        startsAt: req.body?.startsAt,
        idempotencyKey: req.get("Idempotency-Key"),
      });
      ApiResponse.created(res, MESSAGES.response.appointmentHeldPendingPayment, appointment);
    } catch (error) { next(error); }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      ApiResponse.success(res, MESSAGES.response.patientAppointmentsRetrieved, await this._appointmentsUseCase.list(req.user!.sub));
    } catch (error) { next(error); }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.appointmentId;
      if (typeof appointmentId !== "string") throw new ValidationError(MESSAGES.request.appointmentIdRequired);
      ApiResponse.success(res, MESSAGES.response.patientAppointmentRetrieved, await this._appointmentsUseCase.get(appointmentId, req.user!.sub));
    } catch (error) { next(error); }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.appointmentId;
      if (typeof appointmentId !== "string") throw new ValidationError(MESSAGES.request.appointmentIdRequired);
      const appointment = await this._appointmentsUseCase.cancel(appointmentId, req.user!.sub);
      ApiResponse.success(res, appointment.cancellationRefundReviewStatus === "PENDING_REVIEW"
        ? MESSAGES.response.paidAppointmentCancellationPendingReview
        : MESSAGES.response.appointmentCancelled, appointment);
    } catch (error) { next(error); }
  };

  reschedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.appointmentId;
      if (typeof appointmentId !== "string") throw new ValidationError(MESSAGES.request.appointmentIdRequired);
      const appointment = await this._appointmentsUseCase.reschedule({
        appointmentId,
        patientUserId: req.user!.sub,
        listingId: req.body?.listingId,
        date: req.body?.date,
        startsAt: req.body?.startsAt,
      });
      ApiResponse.success(res, MESSAGES.response.appointmentRescheduled, appointment);
    } catch (error) { next(error); }
  };
}

