import type { IPasswordResetLinkGenerator } from "@application/interfaces/services/ILinkGenerator.ts";

export class PasswordResetLinkGenerator
  implements IPasswordResetLinkGenerator
{
  public generate(token: string): string {
    const frontendUrl = process.env.CLIENT_URL;

    if (!frontendUrl) {
      throw new Error("CLIENT_URL is not configured");
    }

    const url = new URL("/reset-password", frontendUrl);

    url.searchParams.set("token", token);

    return url.toString();
  }
}