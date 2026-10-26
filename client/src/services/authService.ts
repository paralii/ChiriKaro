import { api } from '@/lib/http';
import type { AuthResult } from '@/types';

export const authService = {
  requestOtp: (email: string, purpose: 'register' | 'password-reset' | 'profile-change') => api.post('/auth/request-otp', { email, purpose }),
  register: (body: { name: string; email: string; password: string; otp: string }) => api.post<AuthResult>('/auth/register', body),
  login: (body: { email: string; password: string; role: string }) => api.post<AuthResult>('/auth/login', body),
  logout: (refreshToken: string | null) => api.post('/auth/logout', { refreshToken }),
  resetPassword: (body: { email: string; otp: string; password: string }) => api.post('/auth/reset-password', body),
  updateProfile: (name: string) => api.patch<{ name: string }>('/auth/profile', { name }),
  verifyCurrentPassword: (currentPassword: string) => api.post('/auth/profile/password/verify-current', { currentPassword }),
  changePassword: (body: { currentPassword: string; newPassword: string; otp: string }) => api.patch('/auth/profile/password', body),
  getInvitation: (token: string) => api.get<{ email: string; role: string }>(`/invitation/${encodeURIComponent(token)}`),
  acceptInvitation: (body: { token: string; name: string; password: string }) => api.post('/invitation/accept', body),
};