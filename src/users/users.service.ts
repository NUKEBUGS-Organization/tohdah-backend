import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomInt, randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import {
  User,
  UserDocument,
  AccountType,
  type AuthProvider,
} from './schemas/user.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Trip, TripDocument } from '../trips/schemas/trip.schema';
import {
  Request as RequestEntity,
  RequestDocument,
} from '../requests/schemas/request.schema';
import { UserReport, UserReportDocument } from './schemas/user-report.schema';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { ChangeEmailDto } from './dto/change-email.dto';
import type { ChangePhoneDto } from './dto/change-phone.dto';
import type { ReportUserDto } from './dto/report-user.dto';
import { RedisService } from '../common/redis/redis.service';

const SALT_ROUNDS = 10;
const REFERRAL_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** GET /auth/me and PATCH /users/profile response shape (no secrets). */
export type MeProfileResponse = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  accountType: AccountType | null;
  profilePhoto: string | null;
  bio: string | null;
  location: string | null;
  languages: string[];
  travelPreferences: string[];
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isIdVerified: boolean;
  isSelfieVerified: boolean;
  rating: number;
  reviewCount: number;
  onboardingCompleted: boolean;
  onboardingStep: number;
  createdAt: Date | undefined;
  authProvider: AuthProvider;
};

/** GET /users/:id/profile shape */
export type PublicProfileResponse = {
  id: string;
  fullName: string;
  profilePhoto: string | null;
  bio: string | null;
  location: string | null;
  languages: string[];
  accountType: AccountType | null;
  rating: number;
  reviewCount: number;
  createdAt: Date | undefined;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isIdVerified: boolean;
  isSelfieVerified: boolean;
  completedBookingsCount: number;
  supportDeliveriesCount: number;
};

export type UserStatsResponse = {
  totalTrips: number;
  activeTrips: number;
  totalRequests: number;
  completedDeliveries: number;
  supportDeliveries: number;
  totalEarnings: number;
  totalSpent: number;
  averageRating: number;
  reviewCount: number;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Booking.name)
    private bookingModel: Model<BookingDocument>,
    @InjectModel(Trip.name) private tripModel: Model<TripDocument>,
    @InjectModel(RequestEntity.name)
    private requestModel: Model<RequestDocument>,
    @InjectModel(UserReport.name)
    private userReportModel: Model<UserReportDocument>,
    private readonly redisService: RedisService,
  ) {}

  serializeMe(user: UserDocument): MeProfileResponse {
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      accountType: user.accountType ?? null,
      profilePhoto: user.profilePhoto ?? null,
      bio: user.bio ?? null,
      location: user.location ?? null,
      languages: user.languages ?? [],
      travelPreferences: user.travelPreferences ?? [],
      isEmailVerified: !!user.isEmailVerified,
      isPhoneVerified: !!user.isPhoneVerified,
      isIdVerified: !!user.isIdVerified,
      isSelfieVerified: !!user.isSelfieVerified,
      rating: Number(user.rating ?? 0),
      reviewCount: Number(user.reviewCount ?? 0),
      onboardingCompleted: !!user.onboardingCompleted,
      onboardingStep: Number(user.onboardingStep ?? 0),
      createdAt: user.get?.('createdAt') as Date | undefined,
      authProvider: user.authProvider ?? 'local',
    };
  }

  async getMeProfile(userId: string): Promise<MeProfileResponse> {
    const user = await this.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.serializeMe(user);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.userModel.findById(id).exec();
  }

  async requireUser(userId: string): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /** 8 uppercase alphanumeric chars; retries on rare collision. */
  async generateUniqueReferralCode(): Promise<string> {
    for (let attempt = 0; attempt < 8; attempt++) {
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += REFERRAL_CHARS[randomInt(REFERRAL_CHARS.length)];
      }
      const clash = await this.userModel.exists({ referralCode: code });
      if (!clash) return code;
    }
    throw new ConflictException('Could not allocate referral code');
  }

  async create(data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    accountType?: AccountType;
  }): Promise<UserDocument> {
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const referralCode = await this.generateUniqueReferralCode();
    const created = new this.userModel({
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      phoneNumber: data.phoneNumber,
      passwordHash,
      referralCode,
      authProvider: 'local',
      ...(data.accountType ? { accountType: data.accountType } : {}),
    });
    return created.save();
  }

  async createGoogleUser(params: {
    googleId: string;
    email: string;
    fullName: string;
    profilePhoto: string | null;
    authProvider: AuthProvider;
    isEmailVerified: boolean;
  }): Promise<UserDocument> {
    const referralCode = await this.generateUniqueReferralCode();
    const oauthPlaceholderPw = `${randomUUID()}:${randomUUID()}`;
    const passwordHash = await bcrypt.hash(oauthPlaceholderPw, SALT_ROUNDS);
    const created = new this.userModel({
      fullName: params.fullName.trim(),
      email: params.email.trim().toLowerCase(),
      phoneNumber: '—',
      passwordHash,
      referralCode,
      googleId: params.googleId,
      authProvider: params.authProvider,
      profilePhoto: params.profilePhoto ?? undefined,
      isEmailVerified: params.isEmailVerified,
      role: 'user',
      accountStatus: 'active',
    });
    return created.save();
  }

  async updateGoogleId(userId: string, googleId: string): Promise<void> {
    await this.userModel
      .updateOne({ _id: userId }, { $set: { googleId, authProvider: 'google' } })
      .exec();
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<MeProfileResponse> {
    const user = await this.requireUser(userId);

    if (dto.fullName !== undefined) user.fullName = dto.fullName.trim();
    if (dto.bio !== undefined) user.bio = dto.bio?.trim();
    if (dto.location !== undefined) user.location = dto.location?.trim();
    if (dto.languages !== undefined) user.languages = dto.languages;
    if (dto.travelPreferences !== undefined) {
      user.travelPreferences = dto.travelPreferences;
    }
    if (dto.profilePhoto !== undefined) {
      user.profilePhoto = dto.profilePhoto?.trim();
    }
    if (dto.accountType !== undefined) {
      user.accountType = dto.accountType;
    }

    await user.save();
    return this.serializeMe(user);
  }

  /** Sets refresh hash; pass null to clear (uses $unset). */
  async updateRefreshTokenHash(
    userId: string,
    hash: string | null,
  ): Promise<void> {
    if (hash === null) {
      await this.userModel
        .findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } })
        .exec();
    } else {
      await this.userModel
        .findByIdAndUpdate(userId, { $set: { refreshTokenHash: hash } })
        .exec();
    }
  }

  async setOtp(userId: string, code: string, expiry: Date): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        $set: { otpCode: code, otpExpiry: expiry },
      })
      .exec();
  }

  async clearOtpFields(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        $unset: { otpCode: 1, otpExpiry: 1 },
      })
      .exec();
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        $set: { passwordHash },
      })
      .exec();
  }

  async setPasswordFromPlain(userId: string, plain: string): Promise<void> {
    const passwordHash = await bcrypt.hash(plain, SALT_ROUNDS);
    await this.updatePasswordHash(userId, passwordHash);
  }

  async comparePassword(plain: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plain, passwordHash);
  }

  async hashRefreshToken(token: string): Promise<string> {
    return bcrypt.hash(token, SALT_ROUNDS);
  }

  async compareRefreshToken(
    plainToken: string,
    storedHash: string | undefined,
  ): Promise<boolean> {
    if (!storedHash) return false;
    return bcrypt.compare(plainToken, storedHash);
  }

  async updateRatingSummary(
    userId: string,
    rating: number,
    reviewCount: number,
  ): Promise<void> {
    await this.userModel
      .updateOne({ _id: userId }, { $set: { rating, reviewCount } })
      .exec();
  }

  async setVerificationFlag(
    userId: string,
    field: 'email' | 'phone' | 'id' | 'selfie',
  ): Promise<UserDocument | null> {
    const key =
      field === 'email'
        ? 'isEmailVerified'
        : field === 'phone'
          ? 'isPhoneVerified'
          : field === 'id'
            ? 'isIdVerified'
            : 'isSelfieVerified';
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { [key]: true } },
        { new: true },
      )
      .exec();
  }

  private requestCollection(): string {
    return this.requestModel.collection.name;
  }

  async completedBookingsParticipantCount(userId: string): Promise<number> {
    const oid = new Types.ObjectId(userId);
    return this.bookingModel.countDocuments({
      status: 'completed',
      $or: [{ travelerId: oid }, { requesterId: oid }],
    });
  }

  async supportDeliveriesTravelerCount(userId: string): Promise<number> {
    const oid = new Types.ObjectId(userId);
    const rows = await this.bookingModel
      .aggregate<{ n: number }>([
        { $match: { travelerId: oid, status: 'completed' } },
        {
          $lookup: {
            from: this.requestCollection(),
            localField: 'requestId',
            foreignField: '_id',
            as: 'rq',
          },
        },
        { $unwind: '$rq' },
        { $match: { 'rq.type': 'support' } },
        { $count: 'n' },
      ])
      .exec();
    return rows[0]?.n ?? 0;
  }

  async getPublicProfile(userId: string): Promise<PublicProfileResponse> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const [completedBookingsCount, supportDeliveriesCount] = await Promise.all([
      this.completedBookingsParticipantCount(userId),
      this.supportDeliveriesTravelerCount(userId),
    ]);
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      profilePhoto: user.profilePhoto ?? null,
      bio: user.bio ?? null,
      location: user.location ?? null,
      languages: user.languages ?? [],
      accountType: user.accountType ?? null,
      rating: Number(user.rating ?? 0),
      reviewCount: Number(user.reviewCount ?? 0),
      createdAt: user.get?.('createdAt') as Date | undefined,
      isEmailVerified: !!user.isEmailVerified,
      isPhoneVerified: !!user.isPhoneVerified,
      isIdVerified: !!user.isIdVerified,
      isSelfieVerified: !!user.isSelfieVerified,
      completedBookingsCount,
      supportDeliveriesCount,
    };
  }

  private async aggregateSum(
    match: Record<string, unknown>,
    field: '$travelerPayout' | '$agreedFee',
  ): Promise<number> {
    const rows = await this.bookingModel
      .aggregate<{ s: number }>([
        { $match: match },
        {
          $group: {
            _id: null,
            s: { $sum: { $ifNull: [field, 0] } },
          },
        },
      ])
      .exec();
    return rows[0]?.s ?? 0;
  }

  async getStats(userId: string): Promise<UserStatsResponse> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const oid = new Types.ObjectId(userId);

    const [
      totalTrips,
      activeTrips,
      totalRequests,
      completedDeliveries,
      supportDeliveries,
      totalEarnings,
      totalSpent,
    ] = await Promise.all([
      this.tripModel.countDocuments({ travelerId: oid }).exec(),
      this.tripModel
        .countDocuments({ travelerId: oid, status: 'active' })
        .exec(),
      this.requestModel.countDocuments({ requesterId: oid }).exec(),
      this.bookingModel
        .countDocuments({ travelerId: oid, status: 'completed' })
        .exec(),
      this.supportDeliveriesTravelerCount(userId),
      this.aggregateSum(
        { travelerId: oid, status: 'completed' },
        '$travelerPayout',
      ),
      this.aggregateSum({ requesterId: oid, status: 'completed' }, '$agreedFee'),
    ]);

    return {
      totalTrips,
      activeTrips,
      totalRequests,
      completedDeliveries,
      supportDeliveries,
      totalEarnings,
      totalSpent,
      averageRating: Number(user.rating ?? 0),
      reviewCount: Number(user.reviewCount ?? 0),
    };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.requireUser(userId);
    const ok = await this.comparePassword(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.setPasswordFromPlain(userId, dto.newPassword);
    await this.redisService.deleteAllRefreshTokens(userId);
    return { message: 'Password updated. Please log in again.' };
  }

  async changeEmail(
    userId: string,
    dto: ChangeEmailDto,
  ): Promise<{ message: string }> {
    const user = await this.requireUser(userId);
    const ok = await this.comparePassword(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const nextEmail = dto.newEmail.toLowerCase().trim();
    const taken = await this.userModel.findOne({
      email: nextEmail,
      _id: { $ne: user._id },
    });
    if (taken) {
      throw new ConflictException('Email already in use');
    }

    user.email = nextEmail;
    user.isEmailVerified = false;
    await user.save();
    return { message: 'Email updated. Please verify your new email.' };
  }

  async changePhone(
    userId: string,
    dto: ChangePhoneDto,
  ): Promise<{ message: string }> {
    const user = await this.requireUser(userId);
    const ok = await this.comparePassword(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const nextPhone = dto.newPhoneNumber.trim();
    const taken = await this.userModel.findOne({
      phoneNumber: nextPhone,
      _id: { $ne: user._id },
    });
    if (taken) {
      throw new ConflictException('Phone number already in use');
    }

    user.phoneNumber = nextPhone;
    user.isPhoneVerified = false;
    await user.save();
    return { message: 'Phone number updated.' };
  }

  /** Idempotent — no error if already blocked. */
  async blockUser(actorId: string, targetUserId: string): Promise<void> {
    if (actorId === targetUserId) {
      throw new BadRequestException('Cannot block yourself');
    }
    await this.requireUser(actorId);

    const target = await this.findById(targetUserId);
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const tid = targetUserId;
    const actor = await this.userModel.findById(actorId).exec();
    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const blocked = actor.blockedUsers ?? [];
    if (blocked.some((id) => id.toString() === tid)) {
      return;
    }
    blocked.push(new Types.ObjectId(tid));
    actor.blockedUsers = blocked;
    await actor.save();
  }

  async unblockUser(actorId: string, targetUserId: string): Promise<void> {
    await this.requireUser(actorId);
    await this.userModel.updateOne(
      { _id: actorId },
      { $pull: { blockedUsers: new Types.ObjectId(targetUserId) } },
    );
  }

  async listBlocked(actorId: string): Promise<
    Array<{ id: string; fullName: string; profilePhoto: string | null }>
  > {
    const user = await this.userModel
      .findById(actorId)
      .populate<{ blockedUsers: UserDocument[] }>('blockedUsers', 'fullName profilePhoto')
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const list = (user.blockedUsers ?? []) as unknown as UserDocument[];
    return list.map((u) => ({
      id: u._id.toString(),
      fullName: u.fullName,
      profilePhoto: u.profilePhoto ?? null,
    }));
  }

  async reportUser(
    reporterId: string,
    dto: ReportUserDto,
  ): Promise<{ message: string }> {
    if (dto.targetUserId === reporterId) {
      throw new BadRequestException('Cannot report yourself');
    }

    await this.requireUser(reporterId);
    const target = await this.findById(dto.targetUserId);
    if (!target) {
      throw new NotFoundException('User not found');
    }

    await this.userReportModel.create({
      reporterId: new Types.ObjectId(reporterId),
      targetUserId: new Types.ObjectId(dto.targetUserId),
      reason: dto.reason,
      description: dto.description?.trim(),
    });

    return { message: 'Report submitted. Our team will review it.' };
  }

  async addFcmToken(userId: string, token: string): Promise<void> {
    await this.requireUser(userId);
    await this.userModel.updateOne(
      { _id: userId },
      { $addToSet: { fcmTokens: token } },
    );
  }

  async removeFcmToken(userId: string, token: string): Promise<void> {
    await this.requireUser(userId);
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { fcmTokens: token } },
    );
  }

  async getFcmTokens(userId: string): Promise<string[]> {
    const user = await this.userModel
      .findById(userId)
      .select('fcmTokens')
      .lean<{ fcmTokens?: string[] }>()
      .exec();
    return user?.fcmTokens ?? [];
  }

  async cleanInvalidFcmTokens(
    userId: string,
    invalidTokens: string[],
  ): Promise<void> {
    if (!invalidTokens.length) return;
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { fcmTokens: { $in: invalidTokens } } },
    );
  }
}
