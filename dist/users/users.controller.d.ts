import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePhoneDto } from './dto/change-phone.dto';
import { ReportUserDto } from './dto/report-user.dto';
import { RegisterFcmTokenDto } from './dto/register-fcm-token.dto';
import { RedisService } from '../common/redis/redis.service';
export declare class UsersController {
    private readonly usersService;
    private readonly redisService;
    constructor(usersService: UsersService, redisService: RedisService);
    updateProfile(user: RequestUser, dto: UpdateProfileDto): Promise<import("./users.service").MeProfileResponse>;
    changePassword(user: RequestUser, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    changeEmail(user: RequestUser, dto: ChangeEmailDto): Promise<{
        message: string;
    }>;
    changePhone(user: RequestUser, dto: ChangePhoneDto): Promise<{
        message: string;
    }>;
    listBlocked(user: RequestUser): Promise<{
        id: string;
        fullName: string;
        profilePhoto: string | null;
    }[]>;
    report(user: RequestUser, dto: ReportUserDto): Promise<{
        message: string;
    }>;
    block(user: RequestUser, targetUserId: string): Promise<{
        message: string;
    }>;
    unblock(user: RequestUser, targetUserId: string): Promise<{
        message: string;
    }>;
    registerFcmToken(user: RequestUser, body: RegisterFcmTokenDto): Promise<{
        message: string;
    }>;
    removeFcmToken(user: RequestUser, body: RegisterFcmTokenDto): Promise<{
        message: string;
    }>;
    getActiveSessions(user: RequestUser): Promise<{
        activeSessions: number;
    }>;
    revokeAllSessions(user: RequestUser): Promise<{
        message: string;
    }>;
    getProfile(userId: string): Promise<import("./users.service").PublicProfileResponse>;
    getStats(userId: string): Promise<import("./users.service").UserStatsResponse>;
}
