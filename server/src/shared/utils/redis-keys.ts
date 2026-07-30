export const buildRefreshTokenKey = (userId: string, jti: string): string =>
  `auth:refresh:${userId}:${jti}`;

export const buildRefreshTokenPattern = (userId: string): string =>
  `auth:refresh:${userId}:*`;

export const buildOtpResendCooldownKey = (userId: string): string =>
  `auth:otp-cooldown:${userId}`;

export const buildPasswordResetKey = (token: string): string =>
  `auth:password-reset:${token}`;

export const buildAdminInviteKey = (token: string): string =>
  `auth:admin-invite:${token}`;
