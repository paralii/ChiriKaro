export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface IEmailService {
  sendMail(options: SendEmailOptions): Promise<void>;
  sendWelcomeEmail(to: string, name: string): Promise<void>;
  sendVerificationEmail(
    to: string,
    name: string,
    verificationLink: string,
  ): Promise<void>;
  sendPasswordResetEmail(
    to: string,
    name: string,
    resetLink: string,
  ): Promise<void>;
  sendOtpEmail(to: string, name: string, code: string): Promise<void>;
  sendAdminInviteEmail(
    to: string,
    name: string,
    acceptLink: string,
  ): Promise<void>;
}
