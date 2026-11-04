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

  logout: (refreshToken: string | null) => api.post('/auth/logout', { refreshToken }),
  updateProfile: (name: string) => api.patch<{ name: string }>('/auth/profile', { name }),
  verifyCurrentPassword: (currentPassword: string) => api.post('/auth/profile/password/verify-current', { currentPassword }),
  changePassword: (body: { currentPassword: string; newPassword: string; otp: string }) => api.patch('/auth/profile/password', body),
  getInvitation: (token: string) => api.get<{ email: string; role: string }>(`/invitation/${encodeURIComponent(token)}`),
  acceptInvitation: (body: { token: string; name: string; password: string }) => api.post('/invitation/accept', body),
};