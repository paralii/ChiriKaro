export const API_ROUTES = {
  SEARCH: {
    DIRECTORY: "/search/directory",
    DIRECTORY_AVAILABILITY: (listingId: string) => `/search/directory/${encodeURIComponent(listingId)}/availability`,
    DIRECTORY_CLINIC_PROFILE: (listingId: string) => `/search/directory/${encodeURIComponent(listingId)}/clinic-profile`,
    DIRECTORY_DOCTOR_PROFILE: (listingId: string) => `/search/directory/${encodeURIComponent(listingId)}/doctor-profile`,
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
    GUEST_TREATMENT_PLANS: "/clinic/treatment-plans",
    TREATMENT_PLAN_STATUS: (id: string) => `/clinic/treatment-plans/${encodeURIComponent(id)}/status`,
    DASHBOARD: "/clinic/dashboard",
    QUEUE: "/clinic/queue",
    QUEUE_STATUS: (queueEntryId: string) => `/clinic/queue/${encodeURIComponent(queueEntryId)}/status`,
    QUEUE_DOCTORS: "/clinic/queue/doctors",
    QUEUE_APPOINTMENTS: "/clinic/queue/appointments",
    QUEUE_WALK_INS: "/clinic/queue/walk-ins",
    QUEUE_APPOINTMENT_CHECK_IN: (appointmentId: string) => `/clinic/queue/appointments/${encodeURIComponent(appointmentId)}/check-in`,

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
    CONSULTATION_OPEN: (queueEntryId: string) => `/doctor/consultations/queue/${encodeURIComponent(queueEntryId)}`,
    CONSULTATION: (id: string) => `/doctor/consultations/${encodeURIComponent(id)}`,
    CONSULTATION_AI_SYMPTOM_ANALYSIS: (id: string) => `/doctor/consultations/${encodeURIComponent(id)}/ai/symptom-analysis`,
    CONSULTATION_AI_PATIENT_BRIEF: (id: string) => `/doctor/consultations/${encodeURIComponent(id)}/ai/patient-brief`,
    CONSULTATION_AI_INSIGHTS: (id: string) => `/doctor/consultations/${encodeURIComponent(id)}/ai/insights`,
    CONSULTATION_FINALIZE: (id: string) => `/doctor/consultations/${encodeURIComponent(id)}/finalize`,
    CONSULTATION_HISTORY: (patientId: string) => `/doctor/consultations/patients/${encodeURIComponent(patientId)}/history`,
    CONSULTATION_RECORDS: (patientId: string) => `/doctor/consultations/patients/${encodeURIComponent(patientId)}/records`,
    CONSULTATION_ATTACHMENTS: (id: string) => `/doctor/consultations/${encodeURIComponent(id)}/attachments`,
    CONSULTATION_ATTACHMENT: (id: string, attachmentId: string) => `/doctor/consultations/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}`,
    FOLLOW_UPS: '/doctor/follow-ups',
    FOLLOW_UPS_FOR_CONSULTATION: (id: string) => `/doctor/consultations/${encodeURIComponent(id)}/follow-ups`,
    FOLLOW_UP: (id: string) => `/doctor/follow-ups/${encodeURIComponent(id)}`,
    TREATMENT_PLANS: '/doctor/treatment-plans',
    TREATMENT_PLANS_FOR_CONSULTATION: (id: string) => `/doctor/consultations/${encodeURIComponent(id)}/treatment-plans`,
    TREATMENT_PLAN: (id: string) => `/doctor/treatment-plans/${encodeURIComponent(id)}`,
    DELETE_TREATMENT_PLAN: (id: string) => `/doctor/treatment-plans/${encodeURIComponent(id)}`,
    TREATMENT_PLAN_SUBMIT: (id: string) => `/doctor/treatment-plans/${encodeURIComponent(id)}/submit`,
    TREATMENT_PLAN_REVISE: (id: string) => `/doctor/treatment-plans/${encodeURIComponent(id)}/revise`,
    TREATMENT_PLAN_STATUS: (id: string) => `/doctor/treatment-plans/${encodeURIComponent(id)}/status`,
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
    LEAVES: "/doctor/leaves",
    LEAVE_BY_START_DATE: (startDate: string) => `/doctor/leaves/${encodeURIComponent(startDate)}`,

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
    QUEUE: "/patient/queue",
    PRESCRIPTIONS: "/patient/prescriptions",
    PRESCRIPTION_PDF: (consultationId: string) => `/patient/prescriptions/${consultationId}.pdf`,
    FOLLOW_UPS: '/patient/follow-ups',
    FOLLOW_UP: (id: string) => `/patient/follow-ups/${encodeURIComponent(id)}`,
    TREATMENT_PLANS: '/patient/treatment-plans',
    TREATMENT_PLAN: (id: string) => `/patient/treatment-plans/${encodeURIComponent(id)}`,
    TREATMENT_PLAN_DECISION: (id: string) => `/patient/treatment-plans/${encodeURIComponent(id)}/decision`,
    HEALTH_RECORDS: "/patient/health-records",
    HEALTH_RECORD: (id: string) => `/patient/health-records/${encodeURIComponent(id)}`,
    APPOINTMENT_BY_ID: (appointmentId: string) => `/patient/appointments/${encodeURIComponent(appointmentId)}`,
    APPOINTMENT_CANCEL: (appointmentId: string) => `/patient/appointments/${encodeURIComponent(appointmentId)}/cancel`,
    APPOINTMENT_RESCHEDULE: (appointmentId: string) => `/patient/appointments/${encodeURIComponent(appointmentId)}/reschedule`,
    APPOINTMENT_PAYMENT_ORDER: (appointmentId: string) => `/patient/appointments/${encodeURIComponent(appointmentId)}/payment/order`,
    APPOINTMENT_PAYMENT_VERIFY: (appointmentId: string) => `/patient/appointments/${encodeURIComponent(appointmentId)}/payment/verify`,
    APPOINTMENT_PAYMENT_TEST_CONFIRM: (appointmentId: string) => `/patient/appointments/${encodeURIComponent(appointmentId)}/payment/test-confirm`,
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
