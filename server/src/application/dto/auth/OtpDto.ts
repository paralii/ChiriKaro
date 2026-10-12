export interface VerifyOtpDto {
  email: string;
  code: string;
}

export interface ResendOtpDto {
  email: string;
}
