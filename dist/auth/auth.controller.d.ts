import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { GoogleOAuthResult } from './strategies/google.strategy';
import type { RequestUser } from './strategies/jwt-access.strategy';
export declare class AuthController {
    private readonly authService;
    private readonly config;
    constructor(authService: AuthService, config: ConfigService);
    register(dto: RegisterDto): Promise<{
        id: string;
        fullName: string;
        email: string;
        phoneNumber: string;
        accountType: "traveler" | "requester" | "both" | null;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            fullName: string;
            email: string;
            accountType: import("../users/schemas/user.schema").AccountType | null;
        };
    }>;
    googleAuth(): void;
    googleCallback(req: Request & {
        user: GoogleOAuthResult;
    }, res: Response): void;
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(dto: RefreshTokenDto): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        passwordResetToken: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    me(user: RequestUser): Promise<import("../users/users.service").MeProfileResponse>;
}
