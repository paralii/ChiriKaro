import type { Request, Response, NextFunction } from "express";
import { TokenService } from "../../infrastructure/services/jwt.token.service.js";
import { UnauthorizedError, ForbiddenError } from "../../shared/errors/index.js";
import { Role } from "../../domain/value-objects/Role.js";
import type { TokenPayload } from "../../application/interfaces/ITokenService.js";
import { MongoUserRepository } from "../../infrastructure/repositories/user.repository.js";
import { ClinicRepository } from "../../infrastructure/repositories/clinic.repository.js";
import { UserStatus } from "../../shared/enums/user-statues.enum.js";
import { ClinicStatus } from "../../domain/entities/clinic.entity.js";

const tokenService = new TokenService();
const userRepository = new MongoUserRepository();
const clinicRepository = new ClinicRepository();

type AuthRequest = Request & { user?: TokenPayload };

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new UnauthorizedError("Access token is missing"));
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    next(new UnauthorizedError("Access token is missing"));
    return;
  }

  let payload: TokenPayload;
  try {
    payload = tokenService.verifyAccessToken(token);
  } catch (error) {
    next(error);
    return;
  }

  try {
    const user = await userRepository.findById(payload.sub);
    if (!user || user.status !== UserStatus.ACTIVE) {
      next(new ForbiddenError("This account is not active"));
      return;
    }

    if (user.role !== Role.PATIENT && user.role !== Role.SUPER_ADMIN) {
      if (!user.clinicId) {
        next(new ForbiddenError("This account is not linked to a clinic"));
        return;
      }

      const clinic = await clinicRepository.findById(user.clinicId);
      if (!clinic || clinic.status !== ClinicStatus.APPROVED || !clinic.isActive) {
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

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
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
