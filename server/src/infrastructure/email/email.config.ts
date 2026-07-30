import { env } from "@infrastructure/config/env.js";

export interface EmailTransportConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  fromEmail: string;
  fromName: string;
}

export const emailTransportConfig: EmailTransportConfig = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
  fromEmail: env.SMTP_FROM_EMAIL,
  fromName: env.SMTP_FROM_NAME,
};
