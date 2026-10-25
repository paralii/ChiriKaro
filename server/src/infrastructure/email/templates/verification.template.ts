import { renderBaseTemplate } from "@infrastructure/email/templates/index.ts";

export const renderVerificationTemplate = (
  name: string,
  verificationLink: string,
): string =>
  renderBaseTemplate({
    title: "Verify your email",
    bodyHtml: `
      <h2 style="margin-top:0;">Hi ${name},</h2>
      <p>Please verify your email address by clicking the button below.</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${verificationLink}" style="background-color:#0f766e;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Verify Email
        </a>
      </p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break:break-all;color:#0f766e;">${verificationLink}</p>
    `,
  });
