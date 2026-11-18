import type { NextFunction, Request, Response } from "express";
import type { IPatientAppointmentsUseCase } from "@application/interfaces/use-cases/patient/IPatientAppointmentsUseCase.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";
import { ValidationError } from "@shared/errors/index.ts";

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
      ApiResponse.created(res, "Appointment held pending required payment", appointment);
    } catch (error) { next(error); }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      ApiResponse.success(res, "Patient appointments retrieved", await this._appointmentsUseCase.list(req.user!.sub));
    } catch (error) { next(error); }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.appointmentId;
      if (typeof appointmentId !== "string") throw new ValidationError("Appointment id is required");
      ApiResponse.success(res, "Patient appointment retrieved", await this._appointmentsUseCase.get(appointmentId, req.user!.sub));
    } catch (error) { next(error); }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.appointmentId;
      if (typeof appointmentId !== "string") throw new ValidationError("Appointment id is required");
      const appointment = await this._appointmentsUseCase.cancel(appointmentId, req.user!.sub);
      ApiResponse.success(res, appointment.cancellationRefundReviewStatus === "PENDING_REVIEW"
        ? "Appointment cancelled. The paid cancellation is pending manual refund review."
        : "Appointment cancelled", appointment);
    } catch (error) { next(error); }
  };

  reschedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.appointmentId;
      if (typeof appointmentId !== "string") throw new ValidationError("Appointment id is required");
      const appointment = await this._appointmentsUseCase.reschedule({
        appointmentId,
        patientUserId: req.user!.sub,
        listingId: req.body?.listingId,
        date: req.body?.date,
        startsAt: req.body?.startsAt,
      });
      ApiResponse.success(res, "Appointment rescheduled", appointment);
    } catch (error) { next(error); }
  };
}
