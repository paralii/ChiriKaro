import type { Request, Response, NextFunction } from "express";

import { Role } from "@domain/value-objects/Role.ts";
import { UserStatus } from "@domain/enum/user-statues.enum.ts";
import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";

import type {
  ITokenService,
  TokenPayload,
} from "@application/interfaces/services/ITokenService.ts";
import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";

import { UnauthorizedError, ForbiddenError } from "@shared/errors/index.ts";

export interface AuthMiddlewareDependencies {
  tokenService: ITokenService;
  userRepository: IUserRepository;
  clinicRepository: IClinicRepository;
}

export class AuthMiddleware {
  constructor(private readonly dependencies: AuthMiddlewareDependencies) {}

  public authenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      next(new UnauthorizedError("Access token is missing"));
      return;
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      next(new UnauthorizedError("Access token is missing"));
      return;
    }

    let payload: TokenPayload;

    try {
      payload = this.dependencies.tokenService.verifyAccessToken(token);
    } catch {
      next(new UnauthorizedError("Invalid or expired access token"));
      return;
    }

    try {
      const user = await this.dependencies.userRepository.findById(payload.sub);

      if (!user || user.status !== UserStatus.ACTIVE) {
        next(new ForbiddenError("This account is not active"));
        return;
      }

      if (user.role !== Role.PATIENT && user.role !== Role.SUPER_ADMIN) {
        if (!user.clinicId) {
          next(new ForbiddenError("This account is not linked to a clinic"));
          return;
        }

        const clinic = await this.dependencies.clinicRepository.findById(
          user.clinicId,
        );

        if (!clinic || clinic.status !== ClinicStatus.APPROVED) {
          next(new ForbiddenError("This clinic is not active"));
          return;
        }
      }

      req.user = {
        sub: user.id,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
      };

      next();
    } catch (error) {
      next(error);
    }
  };

  public authorize = (...roles: Role[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
      if (!req.user) {
        next(new UnauthorizedError("Not authenticated"));
        return;
      }

      if (!roles.includes(req.user.role)) {
        next(new ForbiddenError("Insufficient permissions"));
        return;
      }

      next();
    };
  };
}
