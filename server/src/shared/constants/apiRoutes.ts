export const API_ROUTES = {
  SEARCH: {
    BASE: "/api/search",
    DIRECTORY: "/directory",
    DIRECTORY_AVAILABILITY: "/directory/:listingId/availability",
    DIRECTORY_CLINIC_PROFILE: "/directory/:listingId/clinic-profile",
    DIRECTORY_DOCTOR_PROFILE: "/directory/:listingId/doctor-profile",
  },

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
    PATIENTS: "/patients",
    PATIENT_STATUS: "/patients/:id/status",
    PATIENT_DETAILS: "/patients/:id",
    DOCTORS: "/doctors",
    DOCTOR_DETAILS: "/doctors/:id",

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
    CONSULTATION_FEE_REQUESTS: "/consultation-fee/requests",

    AVAILABILITY: "/availability",
    AVAILABILITY_SLOTS: "/availability/slots",
  },

  PATIENT: {
    BASE: "/api/patient",

    PROFILE: "/profile",
    DASHBOARD: "/dashboard",
    APPOINTMENTS: "/appointments",
    APPOINTMENT_BY_ID: "/appointments/:appointmentId",
    QUEUE: "/queue",
    APPOINTMENT_CANCEL: "/appointments/:appointmentId/cancel",
    APPOINTMENT_RESCHEDULE: "/appointments/:appointmentId/reschedule",
    APPOINTMENT_PAYMENT_ORDER: "/appointments/:appointmentId/payment/order",
    APPOINTMENT_PAYMENT_VERIFY: "/appointments/:appointmentId/payment/verify",
    APPOINTMENT_PAYMENT_TEST_CONFIRM: "/appointments/:appointmentId/payment/test-confirm",
    APPOINTMENT_PAYMENT_STATUS: "/appointments/:appointmentId/payment/status",
    PAYMENT_WEBHOOK: "/payments/razorpay/webhook",
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
    DOCTOR_SPECIALIZATION_ASSIGNMENTS: "/doctors/specialization-assignments",
    DOCTOR_SPECIALIZATIONS: "/doctors/:doctorId/specializations",
    DOCTOR_SCHEDULES: "/doctors/schedules",
    DOCTOR_WORKING_HOURS: "/doctors/:doctorId/working-hours",
    PENDING_VERIFICATIONS: "/doctors/pending-verification",
    DOCTOR_VERIFICATION: "/doctors/:doctorId/verification",
    DOCTOR_CONSULTATION_FEE: "/doctors/:doctorId/consultation-fee",
    DOCTOR_FEE_CHANGE_REQUESTS: "/doctor-fee-requests",
    DOCTOR_FEE_CHANGE_REQUEST: "/doctor-fee-requests/:doctorId/:requestId",
    DOCTOR_VERIFICATION_DOCUMENT:
      "/doctors/:doctorId/verification/documents/:documentType",
    DOCTOR_VERIFICATION_APPROVE: "/doctors/:doctorId/verification/approve",
    DOCTOR_VERIFICATION_REJECT: "/doctors/:doctorId/verification/reject",
    QUEUE: "/queue",
    QUEUE_STATUS: "/queue/:queueEntryId/status",
    QUEUE_DOCTORS: "/queue/doctors",
    QUEUE_APPOINTMENTS: "/queue/appointments",
    QUEUE_WALK_INS: "/queue/walk-ins",
    QUEUE_APPOINTMENT_CHECK_IN: "/queue/appointments/:appointmentId/check-in",

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
