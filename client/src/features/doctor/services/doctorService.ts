import { api, http } from "@/shared/lib/http";
import { API_ROUTES } from "@/shared/constants/apiRoutes";
import type {
  DoctorAvailability,
  DoctorAvailabilitySlots,
  DoctorConsultationFee,
  DoctorFeeChangeRequest,
  DoctorOnboardingDTO,
  DoctorOnboardingStep,
  DoctorProfile,
  DoctorLeave,
} from "@/shared/types";

type ApiEnvelope<T> = { data?: T };

async function responseData<T>(
  request: Promise<ApiEnvelope<T>>,
  fallback: string,
): Promise<T> {
  const response = await request;
  if (!response.data) throw new Error(fallback);
  return response.data;
}

export const doctorService = {
  getOnboarding: () =>
    responseData(
      api.get<ApiEnvelope<DoctorOnboardingDTO>>(API_ROUTES.DOCTOR.ONBOARDING),
      "Doctor onboarding data was not returned.",
    ),
  updateOnboarding: (step: DoctorOnboardingStep, body: unknown) =>
    responseData(
      api.patch<ApiEnvelope<DoctorOnboardingDTO>>(
        API_ROUTES.DOCTOR.ONBOARDING_STEP(step),
        body,
      ),
      "Updated onboarding data was not returned.",
    ),
  uploadOnboardingDocument: async (documentType: string, file: File) => {
    const safeType = documentType.trim().replace(/\s+/g, "_");
    const response = await http.post<ApiEnvelope<DoctorOnboardingDTO>>(
      `${API_ROUTES.DOCTOR.ONBOARDING_DOCUMENTS}?documentType=${encodeURIComponent(safeType)}`,
      file,
      {
        headers: { "Content-Type": file.type },
      },
    );
    if (!response.data.data)
      throw new Error("Updated doctor documents were not returned.");
    return response.data.data;
  },
  getOnboardingDocument: async (documentType: string) => {
    const safeType = documentType.trim().replace(/\s+/g, "_");
    return (
      await http.get<Blob>(
        API_ROUTES.DOCTOR.ONBOARDING_DOCUMENT_BY_TYPE(safeType),
        { responseType: "blob" },
      )
    ).data;
  },
  deleteOnboardingDocument: (documentType: string) => {
    const safeType = documentType.trim().replace(/\s+/g, "_");

    return responseData(
      api.delete<ApiEnvelope<DoctorOnboardingDTO>>(
        API_ROUTES.DOCTOR.ONBOARDING_DOCUMENT_BY_TYPE(safeType),
      ),
      "Updated doctor documents were not returned.",
    );
  },
  getConsultationFee: () =>
    responseData(
      api.get<ApiEnvelope<DoctorConsultationFee>>(
        API_ROUTES.DOCTOR.CONSULTATION_FEE,
      ),
      "Consultation fee was not returned.",
    ),
  listFeeChangeRequests: () =>
    responseData(api.get<ApiEnvelope<DoctorFeeChangeRequest[]>>(API_ROUTES.DOCTOR.CONSULTATION_FEE_REQUESTS), "Fee change requests were not returned."),
  requestFeeChange: (requestedFee: number, reason?: string) =>
    responseData(api.post<ApiEnvelope<DoctorFeeChangeRequest>>(API_ROUTES.DOCTOR.CONSULTATION_FEE_REQUESTS, { requestedFee, ...(reason ? { reason } : {}) }), "Fee change request was not returned."),
  getAvailability: () =>
    responseData(
      api.get<ApiEnvelope<DoctorAvailability>>(API_ROUTES.DOCTOR.AVAILABILITY),
      "Doctor availability was not returned.",
    ),

  configureAvailability: (
    body: Pick<
      DoctorAvailability,
      "workingHours" | "breaks" | "slotDurationMinutes" | "bufferTimeMinutes"
    >,
  ) =>
    responseData(
      api.put<ApiEnvelope<DoctorAvailability>>(
        API_ROUTES.DOCTOR.AVAILABILITY,
        body,
      ),
      "Updated doctor availability was not returned.",
    ),

  generateAvailabilitySlots: () =>
    responseData(
      api.post<ApiEnvelope<DoctorAvailabilitySlots>>(
        API_ROUTES.DOCTOR.AVAILABILITY_SLOTS,
      ),
      "Availability slots were not returned.",
    ),

  listLeaves: () => responseData(api.get<ApiEnvelope<DoctorLeave[]>>(API_ROUTES.DOCTOR.LEAVES), "Doctor leave was not returned."),
  createLeave: (body: { startDate: string; endDate: string; reason?: string }) => responseData(
    api.post<ApiEnvelope<DoctorLeave[]>>(API_ROUTES.DOCTOR.LEAVES, body), "Saved doctor leave was not returned.",
  ),
  deleteLeave: (startDate: string) => responseData(
    api.delete<ApiEnvelope<DoctorLeave[]>>(API_ROUTES.DOCTOR.LEAVE_BY_START_DATE(startDate)), "Updated doctor leave was not returned.",
  ),

  getProfile: () => api.get<DoctorProfile>(API_ROUTES.DOCTOR.PROFILE),
  patchProfile: (body: unknown) =>
    api.patch<DoctorProfile>(API_ROUTES.DOCTOR.PROFILE, body),
  getUploadUrl: (file: File) =>
    api.post<{ key: string; uploadUrl: string }>(
      API_ROUTES.DOCTOR.DOCUMENT_UPLOAD_URL,
      { fileName: file.name, contentType: file.type, fileSize: file.size },
    ),
  addDocument: (documentType: string, documentKey: string) =>
    api.post<DoctorProfile>(API_ROUTES.DOCTOR.DOCUMENTS, {
      documentType,
      documentKey,
    }),
  getDocumentUrl: (type: string) =>
    api.get<{ url: string }>(API_ROUTES.DOCTOR.DOCUMENT_DOWNLOAD_URL(type)),
  submitVerification: () =>
    responseData(
      api.post<ApiEnvelope<DoctorOnboardingDTO>>(
        API_ROUTES.DOCTOR.VERIFICATION_SUBMIT,
      ),
      "Doctor verification status was not returned.",
    ),
};
