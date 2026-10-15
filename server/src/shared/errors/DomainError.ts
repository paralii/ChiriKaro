export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidRoleAssignmentError extends DomainError {}

export class MissingCredentialsError extends DomainError {
  constructor() {
    super("User must have either a password or an OAuth id");
  }
}

export class InvalidUserDataError extends DomainError {}

export class InvitationExpiredError extends DomainError {
  constructor(invitationId: string) {
    super(`Invitation ${invitationId} has expired`);
  }
}

export class InvitationAlreadyUsedError extends DomainError {
  constructor(invitationId: string) {
    super(`Invitation ${invitationId} has already been used`);
  }
}

export class InvitationCancelledError extends DomainError {
  constructor(invitationId: string) {
    super(`Invitation ${invitationId} has been cancelled`);
  }
}

export class InvitationRevokedError extends InvitationCancelledError {}

export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`A user with email ${email} already exists`);
  }
}

export class UnauthorizedInviterError extends DomainError {
  constructor(inviterRole: string, targetRole: string) {
    super(`${inviterRole} is not permitted to invite ${targetRole}`);
  }
}