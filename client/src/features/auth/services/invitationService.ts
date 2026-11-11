import { api } from "@/shared/lib/http";
import type { InvitationValidation } from "@/shared/types";
import type { Role } from "@/features/auth/store/authSlice";
import { API_ROUTES } from "@/shared/constants/apiRoutes";

type ApiEnvelope<T> = { data?: T };
type AcceptedInvitation = {
  id: string;
  name: string;
  email: string;
  role: Role;
  clinicId: string | null;
  status: string;
};

async function responseData<T>(
  request: Promise<ApiEnvelope<T>>,
  fallback: string,
): Promise<T> {
  const response = await request;
  if (!response.data) throw new Error(fallback);
  return response.data;
}

export const invitationService = {
  validate: (token: string) =>
    responseData(
      api.post<ApiEnvelope<InvitationValidation>>(
        API_ROUTES.INVITATION.VALIDATE,
        {
          token,
        },
      ),
      "Invitation details were not returned.",
    ),
  accept: (body: { token: string; name: string; password: string }) =>
    responseData(
      api.post<ApiEnvelope<AcceptedInvitation>>(
        API_ROUTES.INVITATION.ACCEPT,
        body,
      ),
      "The account details were not returned.",
    ),
};
