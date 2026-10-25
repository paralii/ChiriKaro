import { renderBaseTemplate } from "@infrastructure/email/templates/index.ts";

export const renderWelcomeTemplate = (name: string): string =>
  renderBaseTemplate({
    title: "Welcome to ChiriKaro",
    bodyHtml: `
      <h2 style="margin-top:0;">Welcome, ${name}!</h2>
      <p>Your account has been created successfully. We're glad to have you with us.</p>
      <p>You can now log in and book appointments with our dental specialists.</p>
    `,
  });
