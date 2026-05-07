import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private readonly config;
    private readonly logger;
    private readonly resend;
    private readonly from;
    constructor(config: ConfigService);
    sendOtp(to: string, otp: string, fullName: string): Promise<void>;
    sendPasswordReset(to: string, otp: string, fullName: string): Promise<void>;
    sendWelcome(to: string, fullName: string): Promise<void>;
    sendBookingNotification(to: string, fullName: string, subject: string, message: string): Promise<void>;
    private send;
}
