import { renderBaseTemplate } from "./base.template.js";

export const renderOtpTemplate = (name: string, code: string): string =>
  renderBaseTemplate({
    title: "Your verification code",
    bodyHtml: `
      <h2 style="margin-top:0;">Hi ${name},</h2>
      <p>Use the code below to verify your email address. This code expires in 10 minutes.</p>
      <p style="text-align:center;margin:28px 0;">
        <span style="display:inline-block;background-color:#f1f5f9;color:#0f172a;font-size:28px;font-weight:bold;letter-spacing:8px;padding:16px 24px;border-radius:8px;">
          ${code}
        </span>
      </p>
      <p>If you did not request this code, you can safely ignore this email.</p>
    `,
  });
