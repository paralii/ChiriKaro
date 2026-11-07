import { InvitationRepository } from "@infrastructure/repositories/invitation.repository.ts";
import { ClinicRepository } from "@infrastructure/repositories/clinic.repository.ts";
import { MongoUserRepository } from "@infrastructure/repositories/user.repository.ts";
import { EmailService } from "@infrastructure/email/email.service.ts";
import { TokenService } from "@infrastructure/services/jwt/jwt.token.service.ts";
import { InvitationTokenService } from "@infrastructure/services/invitation-token.service.ts";
import { InvitationLinkGenerator } from "@infrastructure/services/invitation-link-generator.service.ts";
import { PasswordService } from "@infrastructure/services/bcrypt/bcrypt.password.service.ts";
import { AuthMiddleware } from "@presentation/middleware/auth.middleware.ts";
import { InvitationController } from "@presentation/controllers/invitation.controller.ts";
import { createInvitationRouter } from "@presentation/routes/invitation.routes.ts";
import { CreateInvitationUseCase } from "@application/use-cases/invitation/create-invitation.use-case.ts";
import { ListPendingInvitationsUseCase } from "@application/use-cases/invitation/list-pending-invitations.use-case.ts";
import { ResendInvitationUseCase } from "@application/use-cases/invitation/resend-invitation.use-case.ts";
import { ValidateInvitationUseCase } from "@application/use-cases/invitation/validate-invitation.use-case.ts";
import { AcceptInvitationUseCase } from "@application/use-cases/invitation/accept-invitation.use-case.ts";
import type { ICreateInvitationUseCase } from "@application/interfaces/use-cases/invitation/ICreateInvitationUseCase.ts";
import type { IListPendingInvitationsUseCase } from "@application/interfaces/use-cases/invitation/IListPendingInvitationsUseCase.ts";
import type { IResendInvitationUseCase } from "@application/interfaces/use-cases/invitation/IResendInvitationUseCase.ts";
import type { IValidateInvitationUseCase } from "@application/interfaces/use-cases/invitation/IValidateInvitationUseCase.ts";
import type { IAcceptInvitationUseCase } from "@application/interfaces/use-cases/invitation/IAcceptInvitationUseCase.ts";
import { Role } from "@domain/value-objects/Role.ts";

const invitationRepository = new InvitationRepository();
const clinicRepository = new ClinicRepository();
const userRepository = new MongoUserRepository();
const emailService = new EmailService();
const invitationTokenService = new InvitationTokenService();
const invitationLinkGenerator = new InvitationLinkGenerator();
const passwordService = new PasswordService();

const createInvitationUseCase: ICreateInvitationUseCase = new CreateInvitationUseCase(
  clinicRepository,
  userRepository,
  invitationRepository,
  invitationTokenService,
  invitationLinkGenerator,
  emailService,
);
const listPendingInvitationsUseCase: IListPendingInvitationsUseCase =
  new ListPendingInvitationsUseCase(invitationRepository);
const resendInvitationUseCase: IResendInvitationUseCase = new ResendInvitationUseCase(
  invitationRepository,
  invitationTokenService,
  invitationLinkGenerator,
  emailService,
);
const validateInvitationUseCase: IValidateInvitationUseCase =
  new ValidateInvitationUseCase(
    invitationRepository,
    clinicRepository,
    invitationTokenService,
  );
const acceptInvitationUseCase: IAcceptInvitationUseCase =
  new AcceptInvitationUseCase(
    invitationRepository,
    clinicRepository,
    userRepository,
    invitationTokenService,
    passwordService,
  );

const controller = new InvitationController(
  createInvitationUseCase,
  listPendingInvitationsUseCase,
  resendInvitationUseCase,
  validateInvitationUseCase,
  acceptInvitationUseCase,
);
const authMiddleware = new AuthMiddleware({
  tokenService: new TokenService(),
  userRepository,
  clinicRepository,
});

export const invitationRouter = createInvitationRouter(controller, {
  authenticate: authMiddleware.authenticate,
  authorizeClinicAdmin: authMiddleware.authorize(Role.CLINIC_ADMIN),
});
