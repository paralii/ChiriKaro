import type {
  IEmailService,
  OtpEmailPurpose,
  SendEmailOptions,
} from "../../application/interfaces/IEmailService.js";
import { mailTransport } from "./mail.transport.js";
import { emailTransportConfig } from "./email.config.js";
import { logger } from "../logger/logger.js";
import {
  renderWelcomeTemplate,
  renderVerificationTemplate,
  renderPasswordResetTemplate,
  renderOtpTemplate,
  renderAdminInviteTemplate,
} from "./templates/index.js";

export class EmailService implements IEmailService {
  public async sendMail(options: SendEmailOptions): Promise<void> {
    try {
      const transporter = mailTransport.getTransporter();

      await transporter.sendMail({
        from: `"${emailTransportConfig.fromName}" <${emailTransportConfig.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      });

      logger.info(`Email sent to ${options.to} - subject: ${options.subject}`);
    } catch (error) {
      logger.error(
        `Failed to send email to ${options.to}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  public async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendMail({
      to,
      subject: "Welcome to ChiriKaro",
      html: renderWelcomeTemplate(name),
    });
  }

  public async sendVerificationEmail(
    to: string,
    name: string,
    verificationLink: string,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: "Verify your email address",
      html: renderVerificationTemplate(name, verificationLink),
    });
  }

  public async sendPasswordResetEmail(
    to: string,
    name: string,
    resetLink: string,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: "Reset your password",
      html: renderPasswordResetTemplate(name, resetLink),
    });
  }

  public async sendOtpEmail(
    to: string,
    name: string,
    code: string,
    purpose: OtpEmailPurpose,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: renderOtpSubject(purpose),
      html: renderOtpTemplate(name, code, purpose),
    });
  }

  public async sendAdminInviteEmail(
    to: string,
    name: string,
    acceptLink: string,
    role: string,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: "You've been invited to ChiriKaro",
      html: renderAdminInviteTemplate(name, acceptLink, role),
    });
  }
}

function renderOtpSubject(purpose: OtpEmailPurpose): string {
  if (purpose === "registration") return "Verify your ChiriKaro account";
  if (purpose === "password-reset") return "Your ChiriKaro password reset code";
  return "Confirm your ChiriKaro password change";
}
