export interface OAuthProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatar: string | null;
}

export interface IOAuthService {
  verifyGoogleCredential(credential: string): Promise<OAuthProfile>;
}
