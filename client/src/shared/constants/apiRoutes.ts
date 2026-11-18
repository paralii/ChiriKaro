export const API_ROUTES = {
  SEARCH: {
    DIRECTORY: "/search/directory",
    DIRECTORY_AVAILABILITY: (listingId: string) => `/search/directory/${encodeURIComponent(listingId)}/availability`,
  },

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
    GOOGLE: "/auth/google",
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
    PATIENTS: "/super-admin/patients",
    PATIENT_DETAILS: (id: string) => `/super-admin/patients/${encodeURIComponent(id)}`,
    PATIENT_STATUS: (id: string) => `/super-admin/patients/${encodeURIComponent(id)}/status`,
    DOCTORS: "/super-admin/doctors",
    DOCTOR_DETAILS: (id: string) => `/super-admin/doctors/${encodeURIComponent(id)}`,
  },

  CLINIC: {
    REGISTER: "/clinic/register",
    DASHBOARD: "/clinic/dashboard",

    PROFILE: "/clinic/profile",
    SETUP: "/clinic/setup",
    SETUP_SUBMIT: "/clinic/setup/submit",
    SETUP_DOCUMENTS: "/clinic/setup/documents",
    SETUP_DOCUMENT_UPLOAD: (documentType: string) =>
      `/clinic/setup/documents?documentType=${encodeURIComponent(documentType)}`,
    SETUP_DOCUMENT_BY_TYPE: (type: string) =>
      `/clinic/setup/documents/${encodeURIComponent(type)}`,

    INVITATIONS: "/clinic/invitations",
    PENDING_INVITATIONS: "/clinic/invitations/pending",
    RESEND_INVITATION: (id: string) =>
      `/clinic/invitations/${encodeURIComponent(id)}/resend`,

    DOCTORS: "/clinic/doctors",
    DOCTOR_SPECIALIZATION_ASSIGNMENTS: "/clinic/doctors/specialization-assignments",
    DOCTOR_SPECIALIZATIONS: (id: string) =>
      `/clinic/doctors/${encodeURIComponent(id)}/specializations`,
    DOCTOR_SCHEDULES: "/clinic/doctors/schedules",
    DOCTOR_WORKING_HOURS: (id: string) =>
      `/clinic/doctors/${encodeURIComponent(id)}/working-hours`,
    PENDING_DOCTOR_VERIFICATIONS: "/clinic/doctors/pending-verification",

    DOCTOR_DETAILS: (id: string) => `/clinic/doctors/${encodeURIComponent(id)}`,

    DOCTOR_VERIFICATION: (id: string) =>
      `/clinic/doctors/${encodeURIComponent(id)}/verification`,

    DOCTOR_VERIFICATION_APPROVE: (id: string) =>
      `/clinic/doctors/${encodeURIComponent(id)}/verification/approve`,

    DOCTOR_VERIFICATION_REJECT: (id: string) =>
      `/clinic/doctors/${encodeURIComponent(id)}/verification/reject`,

    DOCTOR_VERIFICATION_DOCUMENT: (id: string, type: string) =>
      `/clinic/doctors/${encodeURIComponent(id)}/verification/documents/${encodeURIComponent(type)}`,

    DOCTOR_CONSULTATION_FEE: (id: string) =>
      `/clinic/doctors/${encodeURIComponent(id)}/consultation-fee`,
    DOCTOR_FEE_CHANGE_REQUESTS: "/clinic/doctor-fee-requests",
    DOCTOR_FEE_CHANGE_REQUEST: (doctorId: string, requestId: string) =>
      `/clinic/doctor-fee-requests/${encodeURIComponent(doctorId)}/${encodeURIComponent(requestId)}`,

    DOCTOR_APPROVE: (id: string) =>
      `/clinic/doctors/${encodeURIComponent(id)}/approve`,

    DOCTOR_REJECT: (id: string) =>
      `/clinic/doctors/${encodeURIComponent(id)}/reject`,

    DOCTOR_DOCUMENT_URL: (id: string, type: string) =>
      `/clinic/doctors/${encodeURIComponent(id)}/documents/${encodeURIComponent(type)}/documents`,
  },

  DOCTOR: {
    ONBOARDING: "/doctor/onboarding",
    ONBOARDING_STEP: (step: string) =>
      `/doctor/onboarding/${encodeURIComponent(step)}`,

    ONBOARDING_DOCUMENTS: "/doctor/onboarding/documents",
    ONBOARDING_DOCUMENT_BY_TYPE: (documentType: string) =>
      `/doctor/onboarding/documents/${encodeURIComponent(documentType)}`,

    CONSULTATION_FEE: "/doctor/consultation-fee",
    CONSULTATION_FEE_REQUESTS: "/doctor/consultation-fee/requests",

    AVAILABILITY: "/doctor/availability",
    AVAILABILITY_SLOTS: "/doctor/availability/slots",

    PROFILE: "/doctor/profile",

    DOCUMENTS: "/doctor/documents",
    DOCUMENT_UPLOAD_URL: "/doctor/documents/upload-url",
    DOCUMENT_DOWNLOAD_URL: (type: string) =>
      `/doctor/documents/${encodeURIComponent(type)}/download-url`,

    VERIFICATION_SUBMIT: "/doctor/verification/submit",

    DASHBOARD: "/doctor/dashboard",
  },

  PATIENT: {
    DASHBOARD: "/patient/dashboard",
    PROFILE: "/patient/profile",
    APPOINTMENTS: "/patient/appointments",
    APPOINTMENT_BY_ID: (appointmentId: string) => `/patient/appointments/${encodeURIComponent(appointmentId)}`,
    APPOINTMENT_PAYMENT_ORDER: (appointmentId: string) => `/patient/appointments/${encodeURIComponent(appointmentId)}/payment/order`,
    APPOINTMENT_PAYMENT_VERIFY: (appointmentId: string) => `/patient/appointments/${encodeURIComponent(appointmentId)}/payment/verify`,
    APPOINTMENT_PAYMENT_STATUS: (appointmentId: string) => `/patient/appointments/${encodeURIComponent(appointmentId)}/payment/status`,
  },

  STAFF: {
    DASHBOARD: "/staff/dashboard",
  },

  INVITATION: {
    VALIDATE: "/invitation/validate",
    ACCEPT: "/invitation/accept",
  },
};
