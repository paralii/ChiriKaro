import type { NextFunction, Request, Response } from "express";
import type { IRegisterWalkInUseCase } from "@application/interfaces/use-cases/clinic/IRegisterWalkInUseCase.ts";
import type { ICheckInAppointmentUseCase } from "@application/interfaces/use-cases/clinic/ICheckInAppointmentUseCase.ts";
import type { IListClinicQueueUseCase } from "@application/interfaces/use-cases/clinic/IListClinicQueueUseCase.ts";
import type { IListQueueDoctorsUseCase } from "@application/interfaces/use-cases/clinic/IListQueueDoctorsUseCase.ts";
import type { ITransitionQueueEntryUseCase } from "@application/interfaces/use-cases/clinic/ITransitionQueueEntryUseCase.ts";
import type { ListCheckInAppointmentsUseCase } from "@application/use-cases/clinic/list-check-in-appointments.use-case.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";
import { BadRequestError } from "@shared/errors/index.ts";
import { MESSAGES } from "@shared/constants/messages.constants.ts";

export class ClinicQueueController {
  constructor(
    private readonly registerWalkIn: IRegisterWalkInUseCase,
    private readonly checkInAppointmentUseCase: ICheckInAppointmentUseCase,
    private readonly listQueue: IListClinicQueueUseCase,
    private readonly listDoctors: IListQueueDoctorsUseCase,
    private readonly transitionQueueEntry: ITransitionQueueEntryUseCase,
    private readonly listCheckInAppointments: ListCheckInAppointmentsUseCase,
  ) {}

  createWalkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.clinicId) throw new BadRequestError(MESSAGES.request.authenticatedClinicScopeMissing);
      const result = await this.registerWalkIn.execute({
        clinicId: req.user.clinicId, actorUserId: req.user.sub, actorRole: req.user.role,
        doctorUserId: req.body?.doctorUserId, patientEmail: req.body?.patientEmail,
        guestName: req.body?.guestName,
        idempotencyKey: req.get("Idempotency-Key"),
      });
      ApiResponse.created(res, MESSAGES.response.walkInAddedToQueue, result);
    } catch (error) { next(error); }
  };

  checkInAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.clinicId) throw new BadRequestError(MESSAGES.request.authenticatedClinicScopeMissing);
      const appointmentId = req.params.appointmentId;
      if (typeof appointmentId !== "string") throw new BadRequestError(MESSAGES.request.appointmentIdRequired);
      const result = await this.checkInAppointmentUseCase.execute({ clinicId: req.user.clinicId, actorUserId: req.user.sub, actorRole: req.user.role, appointmentId });
      ApiResponse.created(res, MESSAGES.response.appointmentCheckedIntoQueue, result);
    } catch (error) { next(error); }
  };

  getQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.clinicId) throw new BadRequestError(MESSAGES.request.authenticatedClinicScopeMissing);
      const requestedDoctorUserId = typeof req.query.doctorUserId === "string" ? req.query.doctorUserId : undefined;
      const result = await this.listQueue.execute({
        clinicId: req.user.clinicId, actorUserId: req.user.sub, actorRole: req.user.role,
        ...(requestedDoctorUserId ? { requestedDoctorUserId } : {}),
      });
      ApiResponse.success(res, MESSAGES.response.clinicQueueRetrieved, result);
    } catch (error) { next(error); }
  };

  getDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.clinicId) throw new BadRequestError(MESSAGES.request.authenticatedClinicScopeMissing);
      ApiResponse.success(res, MESSAGES.response.queueDoctorsRetrieved, await this.listDoctors.execute({ clinicId: req.user.clinicId, actorUserId: req.user.sub, actorRole: req.user.role }));
    } catch (error) { next(error); }
  };

  getCheckInAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.clinicId) throw new BadRequestError(MESSAGES.request.authenticatedClinicScopeMissing);
      const result = await this.listCheckInAppointments.execute({ clinicId: req.user.clinicId, actorRole: req.user.role });
      ApiResponse.success(res, MESSAGES.response.checkInAppointmentsRetrieved, result);
    } catch (error) { next(error); }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.clinicId) throw new BadRequestError(MESSAGES.request.authenticatedClinicScopeMissing);
      const queueEntryId = req.params.queueEntryId;
      if (typeof queueEntryId !== "string") throw new BadRequestError(MESSAGES.request.queueEntryIdRequired);
      const result = await this.transitionQueueEntry.execute({
        clinicId: req.user.clinicId,
        actorUserId: req.user.sub,
        actorRole: req.user.role,
        queueEntryId,
        nextStatus: req.body?.status,
      });
      ApiResponse.success(res, MESSAGES.response.queueStatusUpdated, result);
    } catch (error) { next(error); }
  };
}

