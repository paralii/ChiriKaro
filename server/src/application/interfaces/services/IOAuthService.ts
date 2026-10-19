export interface OAuthProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatar: string | null;
}

export interface IOAuthService {
  getAuthUrl(state: string): string;
  getProfileFromCode(code: string): Promise<OAuthProfile>;
}
