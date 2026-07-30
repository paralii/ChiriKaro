import { renderBaseTemplate } from "./base.template.js";

export const renderAdminInviteTemplate = (
  name: string,
  acceptLink: string,
): string =>
  renderBaseTemplate({
    title: "You've been invited",
    bodyHtml: `
      <h2 style="margin-top:0;">Hi ${name},</h2>
      <p>You've been invited to join Chirikaro as a clinic staff.</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${acceptLink}" style="background-color:#0f766e;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Set up your account
        </a>
      </p>
      <p>This invite link expires in 48 hours. If you weren't expecting this, you can ignore this email.</p>
    `,
  });
