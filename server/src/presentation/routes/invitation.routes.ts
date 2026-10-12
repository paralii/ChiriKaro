import { Router } from "express";
import type { RequestHandler } from "express";

import type { InvitationController } from "../controllers/invitation.controller.js";


// import { randomBytes } from "crypto";
// import type { Request, Response } from "express";
// import { Types } from "mongoose";
// import { Invitation, InvitationStatus } from "../../domain/entities/Invitation.entity.js";
// import { ClinicStatus } from "../../domain/entities/clinic.entity.js";
// import { User } from "../../domain/entities/user.entity.js";
// import { Role, INVITE_PERMISSIONS } from "../../domain/value-objects/Role.js";
// import { appConfig } from "../../infrastructure/config/index.js";
// import { ClinicRepository } from "../../infrastructure/repositories/clinic.repository.js";
// import { InvitationRepository } from "../../infrastructure/repositories/invitation.repository.js";
// import { MongoUserRepository } from "../../infrastructure/repositories/user.repository.js";
// import { PasswordService } from "../../infrastructure/services/bcrypt.password.service.js";
// import { authenticate, authorize } from "../middleware/auth.middleware.js";
// import { UserStatus } from "../../shared/enums/user-statues.enum.js";
// import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../shared/errors/index.js";
// import { EmailService } from "../../infrastructure/email/email.service.js";

// const router = Router();
// const clinicRepository = new ClinicRepository();
// const invitationRepository = new InvitationRepository();
// const userRepository = new MongoUserRepository();
// const passwordService = new PasswordService();
// const emailService = new EmailService();

// const normalizeRole = (rawRole: unknown): Role | null => {
//   if (typeof rawRole !== "string") return null;

//   const upper = rawRole.toUpperCase();
//   if (upper === "STAFF") return Role.STAFF;
//   if (upper === "DOCTOR") return Role.DOCTOR;

//   return Object.values(Role).includes(upper as Role) ? (upper as Role) : null;
// };

// router.post(
//   "/clinic/invite",
//   authenticate,
//   authorize(Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
//   async (req: Request, res: Response) => {
//     const { clinicId, email, role } = req.body ?? {};

//     if (!clinicId || typeof clinicId !== "string") {
//       throw new BadRequestError("Clinic id is required");
//     }

//     const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
//     const resolvedRole = normalizeRole(role);

//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
//       throw new BadRequestError("A valid invitation email is required");
//     }

//     if (!resolvedRole || (resolvedRole !== Role.DOCTOR && resolvedRole !== Role.STAFF)) {
//       throw new BadRequestError("Only Doctor and Staff invitations are supported");
//     }

//     const clinic = await clinicRepository.findById(clinicId);
//     if (!clinic) {
//       throw new NotFoundError("Clinic");
//     }

//     if (clinic.status !== ClinicStatus.APPROVED) {
//       throw new BadRequestError("Clinic must be approved before invitations can be sent");
//     }

//     const actorRole = req.user?.role ?? Role.SUPER_ADMIN;
//     if (
//       actorRole === Role.CLINIC_ADMIN &&
//       req.user?.clinicId !== clinicId
//     ) {
//       throw new ForbiddenError("You can only invite members to your own clinic");
//     }

//     const allowedToInvite = INVITE_PERMISSIONS[actorRole] ?? [];
//     if (!allowedToInvite.includes(resolvedRole)) {
//       throw new BadRequestError("This role is not allowed to invite that user type");
//     }

//     const existingUser = await userRepository.findByEmail(normalizedEmail);
//     if (existingUser) {
//       throw new ConflictError("A user with this email already exists");
//     }

//     const existingPendingInvitation = await invitationRepository.findPendingByEmail(normalizedEmail);
//     if (existingPendingInvitation) {
//       throw new ConflictError("A pending invitation already exists for this email");
//     }

//     const token = randomBytes(32).toString("hex");
//     const invitation = Invitation.create({
//       id: new Types.ObjectId().toHexString(),
//       email: normalizedEmail,
//       role: resolvedRole,
//       clinicId,
//       invitedBy: req.user!.sub,
//       token,
//       ttlHours: 72,
//     });

//     const savedInvitation = await invitationRepository.save(invitation);
//     const inviteUrl = `${appConfig.clientUrl}/accept-invitation?token=${savedInvitation.token}`;
//     const roleLabel = resolvedRole === Role.DOCTOR ? "doctor" : "staff member";

//     try {
//       await emailService.sendAdminInviteEmail(
//         normalizedEmail,
//         normalizedEmail.split("@")[0] ?? "there",
//         inviteUrl,
//         roleLabel,
//       );
//     } catch (emailError) {
//       await invitationRepository.deleteById(savedInvitation.id);
//       throw emailError;
//     }

//     res.status(201).json({
//       success: true,
//       message: "Invitation email sent successfully",
//       data: {
//         id: savedInvitation.id,
//         email: savedInvitation.email,
//         role: savedInvitation.role,
//         clinicId: savedInvitation.clinicId,
//         status: savedInvitation.status,
//         expiresAt: savedInvitation.expiresAt,
//         inviteUrl,
//       },
//     });
//   },
// );

// router.get("/invitation/:token", async (req: Request, res: Response) => {
//   const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;

//   if (!token) {
//     throw new BadRequestError("Invitation token is required");
//   }

//   const invitation = await invitationRepository.findByToken(token);
//   if (!invitation) {
//     throw new NotFoundError("Invitation");
//   }

//   invitation.assertUsable();

//   res.status(200).json({
//     success: true,
//     data: {
//       id: invitation.id,
//       email: invitation.email,
//       role: invitation.role,
//       clinicId: invitation.clinicId,
//       status: invitation.status,
//       expiresAt: invitation.expiresAt,
//     },
//   });
// });

// router.post("/invitation/accept", async (req: Request, res: Response) => {
//   const { token, name, password } = req.body ?? {};

//   if (!token || typeof token !== "string") {
//     throw new BadRequestError("Invitation token is required");
//   }

//   if (!name || typeof name !== "string" || name.trim().length < 2) {
//     throw new BadRequestError("Name is required and must be at least 2 characters long");
//   }

//   if (!password || typeof password !== "string" || password.length < 8) {
//     throw new BadRequestError("Password is required and must be at least 8 characters long");
//   }

//   const invitation = await invitationRepository.findByToken(token);
//   if (!invitation) {
//     throw new NotFoundError("Invitation");
//   }

//   invitation.assertUsable();

//   const existingUser = await userRepository.findByEmail(invitation.email);
//   if (existingUser) {
//     throw new ConflictError("A user already exists for this invitation email");
//   }

//   const hashedPassword = await passwordService.hash(password);
//   const user = User.create({
//     id: new Types.ObjectId().toHexString(),
//     name: name.trim(),
//     email: invitation.email,
//     passwordHash: hashedPassword,
//     role: invitation.role,
//     clinicId: invitation.clinicId,
//     status: UserStatus.ACTIVE,
//     isEmailVerified: true,
//   });

//   const savedUser = await userRepository.save(user);
//   invitation.accept();
//   await invitationRepository.save(invitation);

//   res.status(201).json({
//     success: true,
//     message: "Invitation accepted successfully",
//     data: {
//       id: savedUser.id,
//       name: savedUser.name,
//       email: savedUser.email,
//       role: savedUser.role,
//       clinicId: savedUser.clinicId,
//       status: savedUser.status,
//     },
//   });
// });

// export default router;
