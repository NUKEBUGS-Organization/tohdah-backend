import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('RESEND_API_KEY')?.trim();
    this.resend = key ? new Resend(key) : null;
    this.from = this.config.get<string>('EMAIL_FROM', 'noreply@tohdah.com');
  }

  async sendOtp(to: string, otp: string, fullName: string): Promise<void> {
    await this.send(
      to,
      'Your Tohdah verification code',
      `
      <h2>Hi ${fullName},</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing:8px;color:#00C9A7">${otp}</h1>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p>If you didn't request this, ignore this email.</p>
    `,
    );
  }

  async sendPasswordReset(
    to: string,
    otp: string,
    fullName: string,
  ): Promise<void> {
    await this.send(
      to,
      'Reset your Tohdah password',
      `
      <h2>Hi ${fullName},</h2>
      <p>Your password reset code is:</p>
      <h1 style="letter-spacing:8px;color:#00C9A7">${otp}</h1>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p>If you didn't request a password reset, ignore this email.</p>
    `,
    );
  }

  async sendWelcome(to: string, fullName: string): Promise<void> {
    const appUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    await this.send(
      to,
      'Welcome to Tohdah!',
      `
      <h2>Hi ${fullName}, welcome to Tohdah!</h2>
      <p>You can now earn while you travel, send items,
         and support your community.</p>
      <p>Get started: <a href="${appUrl}">Open Tohdah</a></p>
    `,
    );
  }

  async sendBookingNotification(
    to: string,
    fullName: string,
    subject: string,
    message: string,
  ): Promise<void> {
    const appUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    await this.send(
      to,
      subject,
      `
      <h2>Hi ${fullName},</h2>
      <p>${message}</p>
      <p><a href="${appUrl}/app/bookings">View your bookings</a></p>
    `,
    );
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn('RESEND_API_KEY not set; skipping email send');
      return;
    }
    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send email to ${to}: ${msg}`);
    }
  }
}
