"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const resend_1 = require("resend");
let EmailService = EmailService_1 = class EmailService {
    config;
    logger = new common_1.Logger(EmailService_1.name);
    resend;
    from;
    constructor(config) {
        this.config = config;
        const key = this.config.get('RESEND_API_KEY')?.trim();
        this.resend = key ? new resend_1.Resend(key) : null;
        this.from = this.config.get('EMAIL_FROM', 'noreply@tohdah.com');
    }
    async sendOtp(to, otp, fullName) {
        await this.send(to, 'Your Tohdah verification code', `
      <h2>Hi ${fullName},</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing:8px;color:#00C9A7">${otp}</h1>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p>If you didn't request this, ignore this email.</p>
    `);
    }
    async sendPasswordReset(to, otp, fullName) {
        await this.send(to, 'Reset your Tohdah password', `
      <h2>Hi ${fullName},</h2>
      <p>Your password reset code is:</p>
      <h1 style="letter-spacing:8px;color:#00C9A7">${otp}</h1>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p>If you didn't request a password reset, ignore this email.</p>
    `);
    }
    async sendWelcome(to, fullName) {
        const appUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
        await this.send(to, 'Welcome to Tohdah!', `
      <h2>Hi ${fullName}, welcome to Tohdah!</h2>
      <p>You can now earn while you travel, send items,
         and support your community.</p>
      <p>Get started: <a href="${appUrl}">Open Tohdah</a></p>
    `);
    }
    async sendBookingNotification(to, fullName, subject, message) {
        const appUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
        await this.send(to, subject, `
      <h2>Hi ${fullName},</h2>
      <p>${message}</p>
      <p><a href="${appUrl}/app/bookings">View your bookings</a></p>
    `);
    }
    async send(to, subject, html) {
        if (!this.resend) {
            this.logger.warn('RESEND_API_KEY not set; skipping email send');
            return;
        }
        try {
            await this.resend.emails.send({ from: this.from, to, subject, html });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.error(`Failed to send email to ${to}: ${msg}`);
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map