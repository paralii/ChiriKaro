export const API_ROUTES = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",

    VERIFY_OTP: "/auth/verify-otp",
    RESEND_OTP: "/auth/resend-otp",

    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    CHANGE_PASSWORD: "/auth/change-password",

    PROFILE: "/auth/profile",

    REFRESH_TOKEN: "/auth/refresh-token",
    LOGOUT: "/auth/logout",
  },

  SUPER_ADMIN: {
    CLINICS: "/super-admin/clinics",

    CLINIC_DETAILS: (id: string) =>
      `/super-admin/clinics/${encodeURIComponent(id)}`,

    CLINIC_DOCUMENTS: (id: string, documentType: string) =>
      `/super-admin/clinics/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentType)}`,

    CLINIC_STATUS: (id: string) =>
      `/super-admin/clinics/${encodeURIComponent(id)}/status`,

    STATISTICS: "/super-admin/statistics",
  },
  CLINIC: {
    REGISTER: "/clinic/register",
    DASHBOARD: "/clinic/dashboard",

    PROFILE: "/clinic/profile",
    SETUP: "/clinic/setup",
    SETUP_SUBMIT: "/clinic/setup/submit",
    SETUP_DOCUMENTS: "/clinic/setup/documents",

    INVITATIONS: "/clinic/invitations",
    PENDING_INVITATIONS: "/clinic/invitations/pending",

    DOCTORS: "/clinic/doctors",
    PENDING_DOCTOR_VERIFICATIONS: "/clinic/doctors/pending-verification",
  },

  DOCTOR: {
    ONBOARDING: "/doctor/onboarding",
    ONBOARDING_DOCUMENTS: "/doctor/onboarding/documents",

    CONSULTATION_FEE: "/doctor/consultation-fee",

    AVAILABILITY: "/doctor/availability",
    AVAILABILITY_SLOTS: "/doctor/availability/slots",

    PROFILE: "/doctor/profile",

    DOCUMENTS: "/doctor/documents",
    DOCUMENT_UPLOAD_URL: "/doctor/documents/upload-url",

    VERIFICATION_SUBMIT: "/doctor/verification/submit",

    DASHBOARD: "/doctor/dashboard",
  },

  PATIENT: {
    DASHBOARD: "/patient/dashboard",
    PROFILE: "/patient/profile",
  },

  STAFF: {
    DASHBOARD: "/staff/dashboard",
  },

  INVITATION: {
    VALIDATE: "/invitation/validate",
    ACCEPT: "/invitation/accept",
  },
};
