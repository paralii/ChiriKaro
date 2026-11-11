import { api } from "@/shared/lib/http";
import type { LoginResponse, RegisterResult } from "@/shared/types";
import type { Role } from "@/features/auth/store/authSlice";
import { API_ROUTES } from "@/shared/constants/apiRoutes";

export const authService = {
  login: (body: { email: string; password: string }) =>
    api.post<LoginResponse>(API_ROUTES.AUTH.LOGIN, body),
  register: (body: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) => api.post<RegisterResult>(API_ROUTES.AUTH.REGISTER, body),
  verifyOtp: (email: string, code: string) =>
    api.post(API_ROUTES.AUTH.VERIFY_OTP, { email, code }),
  resendOtp: (email: string) => api.post(API_ROUTES.AUTH.RESEND_OTP, { email }),
  forgotPassword: (email: string) =>
    api.post(API_ROUTES.AUTH.FORGOT_PASSWORD, { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post(API_ROUTES.AUTH.RESET_PASSWORD, { token, newPassword }),
  changePassword: (body: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }) => api.post(API_ROUTES.AUTH.CHANGE_PASSWORD, body),
  getProfile: () => api.get(API_ROUTES.AUTH.PROFILE),
  refreshToken: () => api.post(API_ROUTES.AUTH.REFRESH_TOKEN),
  logout: (refreshToken: string | null) =>
    api.post(API_ROUTES.AUTH.LOGOUT, { refreshToken }),
  getGoogleAuthUrl: (intent: "signup" | "signin" = "signin") =>
    `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${API_ROUTES.AUTH.GOOGLE}?intent=${intent}`,
};
