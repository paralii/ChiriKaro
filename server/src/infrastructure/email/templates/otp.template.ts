import { renderBaseTemplate } from "./base.template.js";
import type { OtpEmailPurpose } from "../../../application/interfaces/IEmailService.js";

const otpCopy: Record<OtpEmailPurpose, { title: string; instruction: string }> = {
  registration: {
    title: "Verify your email address",
    instruction: "Use this code to finish creating your ChiriKaro account. It expires in 10 minutes.",
  },
  "password-reset": {
    title: "Reset your password",
    instruction: "Use this code to reset your ChiriKaro password. It expires in 10 minutes.",
  },
  "password-change": {
    title: "Confirm your password change",
    instruction: "Use this code to confirm the password change you requested. It expires in 10 minutes.",
  },
};

export const renderOtpTemplate = (name: string, code: string, purpose: OtpEmailPurpose): string =>
  renderBaseTemplate({
    title: otpCopy[purpose].title,
    bodyHtml: `
      <h2 style="margin-top:0;">Hi ${name},</h2>
      <p>${otpCopy[purpose].instruction}</p>
      <p style="text-align:center;margin:28px 0;">
        <span style="display:inline-block;background-color:#f1f5f9;color:#0f172a;font-size:28px;font-weight:bold;letter-spacing:8px;padding:16px 24px;border-radius:8px;">
          ${code}
        </span>
      </p>
      <p>If you did not request this code, you can safely ignore this email.</p>
    `,
  });
