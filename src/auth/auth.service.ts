import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomInt, randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import type { UserDocument } from '../users/schemas/user.schema';
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

type RefreshJwtPayload = {
  sub: string;
  jti?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
  ) {}

  private toAuthUser(user: UserDocument): AuthUserSummary {
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      accountType: user.accountType ?? null,
    };
  }

  private async signAccessToken(userId: string, email: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      },
    );
  }

  private async signRefreshToken(userId: string, jti: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, jti },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );
  }

  private async signPasswordResetToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId },
      {
        secret: this.config.getOrThrow<string>('JWT_RESET_SECRET'),
        expiresIn: '15m',
      },
    );
  }

  private async verifyRefreshPayload(
    refreshToken: string,
  ): Promise<RefreshJwtPayload> {
    try {
      return await this.jwtService.verifyAsync<RefreshJwtPayload>(
        refreshToken,
        {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async verifyPasswordResetToken(token: string): Promise<{ sub: string }> {
    try {
      return await this.jwtService.verifyAsync<{ sub: string }>(token, {
        secret: this.config.getOrThrow<string>('JWT_RESET_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired password reset token');
    }
  }

  private ensureAccountActive(user: UserDocument): void {
    const status = user.accountStatus ?? 'active';
    if (status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }
  }

  private async issueTokenPair(user: UserDocument) {
    const userId = user._id.toString();
    const jti = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(userId, user.email),
      this.signRefreshToken(userId, jti),
    ]);
    const refreshTokenHash =
      await this.usersService.hashRefreshToken(refreshToken);
    await this.redisService.setRefreshToken(userId, jti, refreshTokenHash);
    return { accessToken, refreshToken, user: this.toAuthUser(user) };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
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

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await this.usersService.comparePassword(
      dto.password,
      user.passwordHash,
    );
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }
    this.ensureAccountActive(user);
    return this.issueTokenPair(user);
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefreshPayload(refreshToken);
    const { sub: userId, jti } = payload;
    if (!jti) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    this.ensureAccountActive(user);

    const storedHash = await this.redisService.getRefreshToken(userId, jti);
    if (!storedHash) {
      throw new UnauthorizedException(
        'Refresh token not found or expired',
      );
    }

    const matches = await this.usersService.compareRefreshToken(
      refreshToken,
      storedHash,
    );
    if (!matches) {
      await this.redisService.deleteAllRefreshTokens(userId);
      throw new UnauthorizedException(
        'Invalid refresh token. All sessions have been terminated.',
      );
    }

    await this.redisService.deleteRefreshToken(userId, jti);

    const newJti = randomUUID();
    const [accessToken, newRefreshToken] = await Promise.all([
      this.signAccessToken(userId, user.email),
      this.signRefreshToken(userId, newJti),
    ]);
    const newHash = await this.usersService.hashRefreshToken(newRefreshToken);
    await this.redisService.setRefreshToken(userId, newJti, newHash);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        jti?: string;
      }>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      if (payload?.sub && payload?.jti) {
        await this.redisService.deleteRefreshToken(payload.sub, payload.jti);
      }
    } catch {
      // Token already expired or invalid — still return success
    }
    return { message: 'Logged out' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);
    if (user) {
      const otp = randomInt(0, 1_000_000).toString().padStart(6, '0');
      await this.redisService.set(`tohdah:otp:${user.email}`, otp, 600);
      await this.emailService.sendPasswordReset(
        user.email,
        otp,
        user.fullName,
      );
    }
    return {
      message:
        'If this email is registered, a reset code has been sent.',
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    const storedOtp = await this.redisService.get(`tohdah:otp:${user.email}`);
    if (!storedOtp || storedOtp !== dto.otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    await this.redisService.del(`tohdah:otp:${user.email}`);
    const passwordResetToken = await this.signPasswordResetToken(
      user._id.toString(),
    );
    return { passwordResetToken };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const payload = await this.verifyPasswordResetToken(dto.passwordResetToken);
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired password reset token');
    }
    await this.usersService.setPasswordFromPlain(
      user._id.toString(),
      dto.newPassword,
    );
    await this.redisService.deleteAllRefreshTokens(user._id.toString());
    return { message: 'Password updated successfully' };
  }

  async getMe(userId: string) {
    return this.usersService.getMeProfile(userId);
  }

  /** Google OAuth callback: find or create user, issue JWT pair (Redis refresh). */
  async findOrCreateGoogleUser(params: {
    googleId: string;
    email: string;
    fullName: string;
    profilePhoto: string | null;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  }> {
    const email = params.email.trim().toLowerCase();
    let user = await this.usersService.findByEmail(email);

    if (user) {
      if (user.googleId && user.googleId !== params.googleId) {
        throw new UnauthorizedException(
          'This email is linked to a different Google account',
        );
      }
      if (!user.googleId) {
        await this.usersService.updateGoogleId(
          user._id.toString(),
          params.googleId,
        );
        const reloaded = await this.usersService.findById(user._id.toString());
        if (!reloaded) {
          throw new UnauthorizedException('User not found');
        }
        user = reloaded;
      }
    } else {
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
}
