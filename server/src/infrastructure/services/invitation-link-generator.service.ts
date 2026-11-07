import type { IInvitationLinkGenerator } from "@application/interfaces/services/IInvitationLinkGenerator.ts";

export class InvitationLinkGenerator implements IInvitationLinkGenerator {
  generate(token: string): string {
    const clientUrl = process.env.CLIENT_URL;
    if (!clientUrl) throw new Error("CLIENT_URL is not configured");

    const url = new URL("/accept-invitation", clientUrl);
    url.searchParams.set("token", token);
    return url.toString();
  }
}
