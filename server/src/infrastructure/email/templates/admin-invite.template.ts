import { renderBaseTemplate } from "./base.template.js";

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
})[character] ?? character);

export const renderAdminInviteTemplate = (
  name: string,
  acceptLink: string,
  role: string,
): string =>
  renderBaseTemplate({
    title: "You've been invited",
    bodyHtml: `
      <h2 style="margin-top:0;">Hi ${escapeHtml(name)},</h2>
      <p>You've been invited to join your clinic on ChiriKaro as a ${escapeHtml(role)}.</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${escapeHtml(acceptLink)}" style="background-color:#0f766e;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Set up your account
        </a>
      </p>
      <p>This invite link expires in 72 hours. If you weren't expecting this, you can ignore this email.</p>
    `,
  });
