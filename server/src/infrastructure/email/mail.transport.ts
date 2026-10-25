import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { emailTransportConfig } from "@infrastructure/email/email.config.ts";
import { logger } from "@infrastructure/logger/logger.js";

class MailTransport {
  private transporter: Transporter | null = null;

  public getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: emailTransportConfig.host,
        port: emailTransportConfig.port,
        secure: emailTransportConfig.secure,
        auth: {
          user: emailTransportConfig.auth.user,
          pass: emailTransportConfig.auth.pass,
        },
      });
    }
    return this.transporter;
  }

  public async verifyConnection(): Promise<void> {
    try {
      await this.getTransporter().verify();
      logger.info("SMTP connection verified");
    } catch (error) {
      logger.error(
        `SMTP connection verification failed: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}

export const mailTransport = new MailTransport();
