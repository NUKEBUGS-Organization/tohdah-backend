import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { AccountType } from '../users/schemas/user.schema';
import { EmailService } from '../common/email/email.service';
import { RedisService } from '../common/redis/redis.service';
type AuthUserSummary = {
    id: string;
    fullName: string;
    email: string;
    accountType: AccountType | null;
};
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly config;
    private readonly emailService;
    private readonly redisService;
    constructor(usersService: UsersService, jwtService: JwtService, config: ConfigService, emailService: EmailService, redisService: RedisService);
    private toAuthUser;
    private signAccessToken;
    private signRefreshToken;
    private signPasswordResetToken;
    private verifyRefreshPayload;
    private verifyPasswordResetToken;
    private ensureAccountActive;
    private issueTokenPair;
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
        user: AuthUserSummary;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshToken: string): Promise<{
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
    getMe(userId: string): Promise<import("../users/users.service").MeProfileResponse>;
    findOrCreateGoogleUser(params: {
        googleId: string;
        email: string;
        fullName: string;
        profilePhoto: string | null;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        isNewUser: boolean;
    }>;
}
export {};
