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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const users_service_1 = require("../users/users.service");
const email_service_1 = require("../common/email/email.service");
const redis_service_1 = require("../common/redis/redis.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    config;
    emailService;
    redisService;
    constructor(usersService, jwtService, config, emailService, redisService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.config = config;
        this.emailService = emailService;
        this.redisService = redisService;
    }
    toAuthUser(user) {
        return {
            id: user._id.toString(),
            fullName: user.fullName,
            email: user.email,
            accountType: user.accountType ?? null,
        };
    }
    async signAccessToken(userId, email) {
        return this.jwtService.signAsync({ sub: userId, email }, {
            secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
            expiresIn: '15m',
        });
    }
    async signRefreshToken(userId, jti) {
        return this.jwtService.signAsync({ sub: userId, jti }, {
            secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });
    }
    async signPasswordResetToken(userId) {
        return this.jwtService.signAsync({ sub: userId }, {
            secret: this.config.getOrThrow('JWT_RESET_SECRET'),
            expiresIn: '15m',
        });
    }
    async verifyRefreshPayload(refreshToken) {
        try {
            return await this.jwtService.verifyAsync(refreshToken, {
                secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
    }
    async verifyPasswordResetToken(token) {
        try {
            return await this.jwtService.verifyAsync(token, {
                secret: this.config.getOrThrow('JWT_RESET_SECRET'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired password reset token');
        }
    }
    ensureAccountActive(user) {
        const status = user.accountStatus ?? 'active';
        if (status !== 'active') {
            throw new common_1.UnauthorizedException('Account is not active');
        }
    }
    async issueTokenPair(user) {
        const userId = user._id.toString();
        const jti = (0, crypto_1.randomUUID)();
        const [accessToken, refreshToken] = await Promise.all([
            this.signAccessToken(userId, user.email),
            this.signRefreshToken(userId, jti),
        ]);
        const refreshTokenHash = await this.usersService.hashRefreshToken(refreshToken);
        await this.redisService.setRefreshToken(userId, jti, refreshTokenHash);
        return { accessToken, refreshToken, user: this.toAuthUser(user) };
    }
    async register(dto) {
        const email = dto.email.trim().toLowerCase();
        const existing = await this.usersService.findByEmail(email);
        if (existing) {
            throw new common_1.ConflictException('An account with this email already exists');
        }
        const user = await this.usersService.create({
            fullName: dto.fullName.trim(),
            email,
            phoneNumber: dto.phoneNumber.trim(),
            password: dto.password,
            accountType: dto.accountType,
        });
        await this.emailService.sendWelcome(user.email, user.fullName);
        return {
            id: user._id.toString(),
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            accountType: user.accountType ?? null,
        };
    }
    async login(dto) {
        const email = dto.email.trim().toLowerCase();
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const ok = await this.usersService.comparePassword(dto.password, user.passwordHash);
        if (!ok) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        this.ensureAccountActive(user);
        return this.issueTokenPair(user);
    }
    async refresh(refreshToken) {
        const payload = await this.verifyRefreshPayload(refreshToken);
        const { sub: userId, jti } = payload;
        if (!jti) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        this.ensureAccountActive(user);
        const storedHash = await this.redisService.getRefreshToken(userId, jti);
        if (!storedHash) {
            throw new common_1.UnauthorizedException('Refresh token not found or expired');
        }
        const matches = await this.usersService.compareRefreshToken(refreshToken, storedHash);
        if (!matches) {
            await this.redisService.deleteAllRefreshTokens(userId);
            throw new common_1.UnauthorizedException('Invalid refresh token. All sessions have been terminated.');
        }
        await this.redisService.deleteRefreshToken(userId, jti);
        const newJti = (0, crypto_1.randomUUID)();
        const [accessToken, newRefreshToken] = await Promise.all([
            this.signAccessToken(userId, user.email),
            this.signRefreshToken(userId, newJti),
        ]);
        const newHash = await this.usersService.hashRefreshToken(newRefreshToken);
        await this.redisService.setRefreshToken(userId, newJti, newHash);
        return { accessToken, refreshToken: newRefreshToken };
    }
    async logout(refreshToken) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
            });
            if (payload?.sub && payload?.jti) {
                await this.redisService.deleteRefreshToken(payload.sub, payload.jti);
            }
        }
        catch {
        }
        return { message: 'Logged out' };
    }
    async forgotPassword(dto) {
        const email = dto.email.trim().toLowerCase();
        const user = await this.usersService.findByEmail(email);
        if (user) {
            const otp = (0, crypto_1.randomInt)(0, 1_000_000).toString().padStart(6, '0');
            await this.redisService.set(`tohdah:otp:${user.email}`, otp, 600);
            await this.emailService.sendPasswordReset(user.email, otp, user.fullName);
        }
        return {
            message: 'If this email is registered, a reset code has been sent.',
        };
    }
    async verifyOtp(dto) {
        const email = dto.email.trim().toLowerCase();
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid or expired OTP');
        }
        const storedOtp = await this.redisService.get(`tohdah:otp:${user.email}`);
        if (!storedOtp || storedOtp !== dto.otp) {
            throw new common_1.UnauthorizedException('Invalid or expired OTP');
        }
        await this.redisService.del(`tohdah:otp:${user.email}`);
        const passwordResetToken = await this.signPasswordResetToken(user._id.toString());
        return { passwordResetToken };
    }
    async resetPassword(dto) {
        const payload = await this.verifyPasswordResetToken(dto.passwordResetToken);
        const user = await this.usersService.findById(payload.sub);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid or expired password reset token');
        }
        await this.usersService.setPasswordFromPlain(user._id.toString(), dto.newPassword);
        await this.redisService.deleteAllRefreshTokens(user._id.toString());
        return { message: 'Password updated successfully' };
    }
    async getMe(userId) {
        return this.usersService.getMeProfile(userId);
    }
    async findOrCreateGoogleUser(params) {
        const email = params.email.trim().toLowerCase();
        let user = await this.usersService.findByEmail(email);
        if (user) {
            if (user.googleId && user.googleId !== params.googleId) {
                throw new common_1.UnauthorizedException('This email is linked to a different Google account');
            }
            if (!user.googleId) {
                await this.usersService.updateGoogleId(user._id.toString(), params.googleId);
                const reloaded = await this.usersService.findById(user._id.toString());
                if (!reloaded) {
                    throw new common_1.UnauthorizedException('User not found');
                }
                user = reloaded;
            }
        }
        else {
            user = await this.usersService.createGoogleUser({
                googleId: params.googleId,
                email,
                fullName: params.fullName,
                profilePhoto: params.profilePhoto,
                authProvider: 'google',
                isEmailVerified: true,
            });
            void this.emailService.sendWelcome(user.email, user.fullName);
        }
        this.ensureAccountActive(user);
        const { accessToken, refreshToken } = await this.issueTokenPair(user);
        const isNewUser = !user.onboardingCompleted;
        return { accessToken, refreshToken, isNewUser };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_service_1.EmailService,
        redis_service_1.RedisService])
], AuthService);
//# sourceMappingURL=auth.service.js.map