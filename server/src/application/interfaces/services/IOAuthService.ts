export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface IOAuthService {
  getAuthUrl(): string;
  getProfileFromCode(code: string): Promise<GoogleProfile>;
}
