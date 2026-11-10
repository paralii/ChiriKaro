import { api, http } from "@/shared/lib/http";
import { API_ROUTES } from "@/shared/constants/apiRoutes";
import type {
  DoctorAvailability,
  DoctorAvailabilitySlots,
  DoctorConsultationFee,
  DoctorOnboardingDTO,
  DoctorOnboardingStep,
  DoctorProfile,
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
        `${API_ROUTES.DOCTOR.ONBOARDING}/${step}`,
        body,
      ),
      "Updated onboarding data was not returned.",
    ),
  uploadOnboardingDocument: async (documentType: string, file: File) => {
    const safeType = documentType.trim().replace(/\s+/g, "_");
    const response = await http.post<ApiEnvelope<DoctorOnboardingDTO>>(
      `${API_ROUTES.DOCTOR.ONBOARDING_DOCUMENTS}/${encodeURIComponent(safeType)}`,
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
        `${API_ROUTES.DOCTOR.ONBOARDING_DOCUMENTS}/${encodeURIComponent(safeType)}`,
        { responseType: "blob" },
      )
    ).data;
  },
  deleteOnboardingDocument: (documentType: string) =>
    responseData(
      api.delete<ApiEnvelope<DoctorOnboardingDTO>>(
        `${API_ROUTES.DOCTOR.ONBOARDING_DOCUMENTS}/${encodeURIComponent(documentType.trim().replace(/\s+/g, "_"))}`,
      ),
      "Updated doctor documents were not returned.",
    ),
  getConsultationFee: () =>
    responseData(
      api.get<ApiEnvelope<DoctorConsultationFee>>(
        API_ROUTES.DOCTOR.CONSULTATION_FEE,
      ),
      "Consultation fee was not returned.",
    ),
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
    api.get<{ url: string }>(
      `${API_ROUTES.DOCTOR.DOCUMENTS}/${encodeURIComponent(type)}/download-url`,
    ),
  submitVerification: () =>
    responseData(
      api.post<ApiEnvelope<DoctorOnboardingDTO>>(
        "API_ROUTES.DOCTOR.VERIFICATION_SUBMIT",
      ),
      "Doctor verification status was not returned.",
    ),
};
