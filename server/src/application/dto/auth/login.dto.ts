export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    clinicId: string | null;
  };
}