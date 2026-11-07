import type { NextFunction, Request, Response } from "express";
import { HttpStatus } from "@shared/enums/http-status.enum.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";
import type { ICreateInvitationUseCase } from "@application/interfaces/use-cases/invitation/ICreateInvitationUseCase.ts";
import type { IListPendingInvitationsUseCase } from "@application/interfaces/use-cases/invitation/IListPendingInvitationsUseCase.ts";
import type { IResendInvitationUseCase } from "@application/interfaces/use-cases/invitation/IResendInvitationUseCase.ts";
import type { IValidateInvitationUseCase } from "@application/interfaces/use-cases/invitation/IValidateInvitationUseCase.ts";
import type { IAcceptInvitationUseCase } from "@application/interfaces/use-cases/invitation/IAcceptInvitationUseCase.ts";
import type { AcceptInvitationDTO } from "@application/dto/invitation/accept-invitation.dto.ts";

export class InvitationController {
  constructor(
    private readonly _createInvitationUseCase: ICreateInvitationUseCase,
    private readonly _listPendingInvitationsUseCase: IListPendingInvitationsUseCase,
    private readonly _resendInvitationUseCase: IResendInvitationUseCase,
    private readonly _validateInvitationUseCase: IValidateInvitationUseCase,
    private readonly _acceptInvitationUseCase: IAcceptInvitationUseCase,
  ) {}

  validate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this._validateInvitationUseCase.execute(req.body?.token);
      res.status(HttpStatus.OK).json(
        ApiResponse.success("Invitation is valid", result),
      );
    } catch (error) {
      next(error);
    }
  };

  accept = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this._acceptInvitationUseCase.execute(
        req.body as AcceptInvitationDTO,
      );
      res.status(HttpStatus.CREATED).json(
        ApiResponse.created("Invitation accepted successfully", result),
      );
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invitation = await this._createInvitationUseCase.execute({
        clinicId: req.user!.clinicId!,
        invitedBy: req.user!.sub,
        email: req.body?.email,
        role: req.body?.role,
      });
      res.status(HttpStatus.CREATED).json(
        ApiResponse.created("Invitation email sent successfully", invitation),
      );
    } catch (error) {
      next(error);
    }
  };

  listPending = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invitations = await this._listPendingInvitationsUseCase.execute(
        req.user!.clinicId!,
      );
      res.status(HttpStatus.OK).json(
        ApiResponse.success("Pending invitations retrieved successfully", invitations),
      );
    } catch (error) {
      next(error);
    }
  };

  resend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invitation = await this._resendInvitationUseCase.execute(
        req.params.id as string,
        req.user!.clinicId!,
      );
      res.status(HttpStatus.OK).json(
        ApiResponse.success("Invitation email resent successfully", invitation),
      );
    } catch (error) {
      next(error);
    }
  };
}
