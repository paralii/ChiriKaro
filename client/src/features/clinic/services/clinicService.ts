import { api, http } from "@/shared/lib/http";
import type {
  ClinicDashboard,
  ClinicProfile,
  ClinicDoctorSpecialization,
  ClinicDoctorSchedule,
  DoctorAvailability,
  DoctorConsultationFee,
  DoctorFeeChangeRequest,
  DoctorDetail,
  DoctorOnboardingDTO,
  DoctorSummary,
  DoctorVerificationSummary,
  Invitation,
  WorkingHour,
} from "@/shared/types";
import { API_ROUTES } from "@/shared/constants/apiRoutes";

const enc = encodeURIComponent;

export type RegisterClinicRequest = {
  admin: { name: string; email: string; password: string };
  clinic: { name: string };
};

type ApiEnvelope<T> = { data?: T };
async function responseData<T>(
  request: Promise<ApiEnvelope<T>>,
  fallback: string,
): Promise<T> {
  const response = await request;
  if (!response.data) throw new Error(fallback);
  return response.data;
}

export const clinicService = {
  register: (body: RegisterClinicRequest) =>
    api.post(API_ROUTES.CLINIC.REGISTER, body),
  dashboard: () =>
    responseData(
      api.get<ApiEnvelope<ClinicDashboard>>(API_ROUTES.CLINIC.DASHBOARD),
      "Clinic dashboard data was not returned.",
    ),
  getProfile: () =>
    responseData(
      api.get<ApiEnvelope<ClinicProfile>>(API_ROUTES.CLINIC.PROFILE),
      "Clinic profile was not returned.",
    ),
  updateProfile: (body: Partial<ClinicProfile>) =>
    responseData(
      api.patch<ApiEnvelope<ClinicProfile>>(API_ROUTES.CLINIC.PROFILE, body),
      "Updated clinic profile was not returned.",
    ),
  updateSetup: (body: {
    location?: Pick<ClinicProfile, "address" | "city" | "state" | "pincode">;
    specializations?: string[];
    workingHours?: WorkingHour[];
    timeZone?: string;
  }) =>
    responseData(
      api.patch<ApiEnvelope<ClinicProfile>>(API_ROUTES.CLINIC.SETUP, body),
      "Clinic setup was not returned.",
    ),
  submitSetup: () =>
    responseData(
      api.post<ApiEnvelope<ClinicProfile>>(API_ROUTES.CLINIC.SETUP_SUBMIT),
      "Clinic setup submission was not returned.",
    ),
  uploadDocument: async (documentType: string, file: File) => {
    const safeType = documentType.trim().replace(/\s+/g, "_");
    const response = await http.post<ApiEnvelope<ClinicProfile>>(
      API_ROUTES.CLINIC.SETUP_DOCUMENT_UPLOAD(safeType),
      file,
      {
        headers: { "Content-Type": file.type },
      },
    );
    if (!response.data.data)
      throw new Error("Updated clinic documents were not returned.");
    return response.data.data;
  },
  getDocument: async (type: string) => {
    const safeType = type.trim().replace(/\s+/g, "_");
    return (
      await http.get<Blob>(API_ROUTES.CLINIC.SETUP_DOCUMENT_BY_TYPE(safeType), {
        responseType: "blob",
      })
    ).data;
  },
  invite: (body: { email: string; role: "DOCTOR" | "STAFF" }) =>
    responseData(
      api.post<ApiEnvelope<Invitation>>(API_ROUTES.CLINIC.INVITATIONS, body),
      "Invitation details were not returned.",
    ),
  listPendingInvitations: () =>
    responseData(
      api.get<ApiEnvelope<Invitation[]>>(API_ROUTES.CLINIC.PENDING_INVITATIONS),
      "Pending invitations were not returned.",
    ),
  resendInvitation: (id: string) =>
    responseData(
      api.post<ApiEnvelope<Invitation>>(
        API_ROUTES.CLINIC.RESEND_INVITATION(id),
      ),
      "Updated invitation details were not returned.",
    ),
  listPendingDoctorVerifications: () =>
    responseData(
      api.get<ApiEnvelope<DoctorVerificationSummary[]>>(
        API_ROUTES.CLINIC.PENDING_DOCTOR_VERIFICATIONS,
      ),
      "Pending doctor verifications were not returned.",
    ),
  listDoctorSpecializationAssignments: () =>
    responseData(
      api.get<ApiEnvelope<ClinicDoctorSpecialization[]>>(
        API_ROUTES.CLINIC.DOCTOR_SPECIALIZATION_ASSIGNMENTS,
      ),
      "Clinic doctor specialization assignments were not returned.",
    ),
  updateDoctorSpecializations: (id: string, specializations: string[]) =>
    responseData(
      api.patch<ApiEnvelope<ClinicDoctorSpecialization>>(
        API_ROUTES.CLINIC.DOCTOR_SPECIALIZATIONS(id),
        { specializations },
      ),
      "Updated doctor specializations were not returned.",
    ),
  listDoctorSchedules: () =>
    responseData(
      api.get<ApiEnvelope<ClinicDoctorSchedule[]>>(API_ROUTES.CLINIC.DOCTOR_SCHEDULES),
      "Clinic doctor schedules were not returned.",
    ),
  updateDoctorWorkingHours: (id: string, workingHours: ClinicDoctorSchedule["workingHours"]) =>
    responseData(
      api.patch<ApiEnvelope<DoctorAvailability>>(
        API_ROUTES.CLINIC.DOCTOR_WORKING_HOURS(id),
        { workingHours },
      ),
      "Updated doctor working hours were not returned.",
    ),
  getDoctorVerification: (id: string) =>
    responseData(
      api.get<ApiEnvelope<DoctorOnboardingDTO>>(
        `${API_ROUTES.CLINIC.DOCTORS}/${enc(id)}/verification`,
      ),
      "Doctor verification details were not returned.",
    ),
  approveDoctorVerification: (id: string) =>
    responseData(
      api.post<ApiEnvelope<DoctorOnboardingDTO>>(
        API_ROUTES.CLINIC.DOCTOR_VERIFICATION_APPROVE(id),
      ),
      "Doctor approval was not returned.",
    ),
  rejectDoctorVerification: (id: string, reason: string) =>
    responseData(
      api.post<ApiEnvelope<DoctorOnboardingDTO>>(
        API_ROUTES.CLINIC.DOCTOR_VERIFICATION_REJECT(id),
        { reason },
      ),
      "Doctor rejection was not returned.",
    ),
  getDoctorVerificationDocument: async (id: string, type: string) =>
    (
      await http.get<Blob>(
        API_ROUTES.CLINIC.DOCTOR_VERIFICATION_DOCUMENT(
          id,
          type.trim().replace(/\s+/g, "_"),
        ),
        { responseType: "blob" },
      )
    ).data,
  setDoctorFee: (id: string, consultationFee: number) =>
    responseData(
      api.patch<ApiEnvelope<DoctorConsultationFee>>(
        API_ROUTES.CLINIC.DOCTOR_CONSULTATION_FEE(id),
        { consultationFee },
      ),
      "Updated consultation fee was not returned.",
    ),
  listDoctorFeeChangeRequests: () =>
    responseData(api.get<ApiEnvelope<DoctorFeeChangeRequest[]>>(API_ROUTES.CLINIC.DOCTOR_FEE_CHANGE_REQUESTS), "Fee change requests were not returned."),
  reviewDoctorFeeChangeRequest: (doctorId: string, requestId: string, decision: 'APPROVED' | 'REJECTED', reason?: string) =>
    responseData(api.patch<ApiEnvelope<DoctorFeeChangeRequest>>(API_ROUTES.CLINIC.DOCTOR_FEE_CHANGE_REQUEST(doctorId, requestId), { decision, ...(reason ? { reason } : {}) }), "Fee change review was not returned."),
  listDoctors: () => api.get<DoctorSummary[]>(API_ROUTES.CLINIC.DOCTORS),
  getDoctor: (id: string) =>
    api.get<DoctorDetail>(API_ROUTES.CLINIC.DOCTOR_DETAILS(id)),
  approveDoctor: (id: string) =>
    api.post(API_ROUTES.CLINIC.DOCTOR_APPROVE(id)),
  rejectDoctor: (id: string, reason: string) =>
    api.post(API_ROUTES.CLINIC.DOCTOR_REJECT(id), { reason }),
  getDoctorDocumentUrl: (id: string, type: string) =>
    api.get<{ url: string }>(
      API_ROUTES.CLINIC.DOCTOR_DOCUMENT_URL(id, type),
    ),
};
