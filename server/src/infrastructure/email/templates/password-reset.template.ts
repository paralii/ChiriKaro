import { renderBaseTemplate } from "./base.template.js";

export const renderPasswordResetTemplate = (
  name: string,
  resetLink: string,
): string =>
  renderBaseTemplate({
    title: "Reset your password",
    bodyHtml: `
      <h2 style="margin-top:0;">Hi ${name},</h2>
      <p>We received a request to reset your password. Click the button below to set a new one.</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${resetLink}" style="background-color:#dc2626;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Reset Password
        </a>
      </p>
      <p>If you did not request this, you can safely ignore this email. This link expires in 1 hour.</p>
    `,
  });
