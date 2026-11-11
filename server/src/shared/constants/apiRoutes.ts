export const API_ROUTES = {
  AUTH: {
    BASE: "/api/auth",

    LOGIN: "/login",
    REGISTER: "/register",
    VERIFY_OTP: "/verify-otp",
    RESEND_OTP: "/resend-otp",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    CHANGE_PASSWORD: "/change-password",
    PROFILE: "/profile",
    REFRESH_TOKEN: "/refresh-token",
    LOGOUT: "/logout",
    GOOGLE: "/google",
    GOOGLE_CALLBACK: "/google/callback",
  },

  SUPER_ADMIN: {
    BASE: "/api/super-admin",

    CLINICS: "/clinics",
    CLINIC_DETAILS: "/clinics/:id",
    CLINIC_DOCUMENTS: "/clinics/:id/documents",
    CLINIC_DOCUMENT_BY_TYPE: "/clinics/:id/documents/:documentType",
    CLINIC_STATUS: "/clinics/:id/status",

    STATISTICS: "/statistics",
  },

  DOCTOR: {
    BASE: "/api/doctor",

    PROFILE: "/profile",

    ONBOARDING: "/onboarding",
    ONBOARDING_STEP: "/onboarding/:step",
    ONBOARDING_DOCUMENTS: "/onboarding/documents",
    ONBOARDING_DOCUMENT_BY_TYPE: "/onboarding/documents/:documentType",

    VERIFICATION: "/verification",
    VERIFICATION_SUBMIT: "/verification/submit",

    CONSULTATION_FEE: "/consultation-fee",

    AVAILABILITY: "/availability",
    AVAILABILITY_SLOTS: "/availability/slots",
  },

  PATIENT: {
    BASE: "/api/patient",

    PROFILE: "/profile",
    DASHBOARD: "/dashboard",
  },

  CLINIC: {
    BASE: "/api/clinic",

    REGISTER: "/register",
    DASHBOARD: "/dashboard",
    PROFILE: "/profile",
    SETUP: "/setup",
    SETUP_DOCUMENTS: "/setup/documents",
    SETUP_DOCUMENT_BY_TYPE: "/setup/documents/:documentType",
    SETUP_SUBMIT: "/setup/submit",

    DOCTORS: "/doctors",
    PENDING_VERIFICATIONS: "/doctors/pending-verification",
    DOCTOR_VERIFICATION: "/doctors/:doctorId/verification",
    DOCTOR_CONSULTATION_FEE: "/doctors/:doctorId/consultation-fee",
    DOCTOR_VERIFICATION_DOCUMENT:
      "/doctors/:doctorId/verification/documents/:documentType",
    DOCTOR_VERIFICATION_APPROVE: "/doctors/:doctorId/verification/approve",
    DOCTOR_VERIFICATION_REJECT: "/doctors/:doctorId/verification/reject",

    INVITATIONS: "/invitations",
    PENDING_INVITATIONS: "/invitations/pending",
    RESEND_INVITATION: "/invitations/:id/resend",
  },

  INVITATION: {
    BASE: "/api/invitation",

    VALIDATE: "/validate",
    ACCEPT: "/accept",
  },
};
