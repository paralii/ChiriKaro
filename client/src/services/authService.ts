import { api } from '@/shared/lib/http';
import type { AuthResult, RegisterResult } from '@/shared/types';
import type { Role } from '@/store/slices/authSlice';

export const authService = {
  login: (body: { email: string; password: string; }) => api.post<AuthResult>('/auth/login', body),
  register: (body: { name: string; email: string; password: string; role: Role }) => api.post<RegisterResult>('/auth/register', body),
  verifyOtp: (email: string, code: string) => api.post('/auth/verify-otp', { email, code }),
  resendOtp: (email: string) => api.post('/auth/resend-otp', { email }),
  forgotPassword:(email: string) => api.post("/auth/forgot-password", {email}),
  resetPassword:(token: string, newPassword: string) => api.post("/auth/reset-password", {token, newPassword}),
  changePassword: (body: { userId: string, currentPassword: string; newPassword: string;}) => api.post('/auth/change-password', body),
  getProfile: () => api.get('/auth/profile'),
  refreshToken: () => api.post('/auth/refresh-token'),
  logout: (refreshToken: string | null) => api.post('/auth/logout', { refreshToken }),
};