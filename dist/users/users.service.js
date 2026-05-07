"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto_1 = require("crypto");
const bcrypt = __importStar(require("bcrypt"));
const user_schema_1 = require("./schemas/user.schema");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
const trip_schema_1 = require("../trips/schemas/trip.schema");
const request_schema_1 = require("../requests/schemas/request.schema");
const user_report_schema_1 = require("./schemas/user-report.schema");
const redis_service_1 = require("../common/redis/redis.service");
const SALT_ROUNDS = 10;
const REFERRAL_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let UsersService = class UsersService {
    userModel;
    bookingModel;
    tripModel;
    requestModel;
    userReportModel;
    redisService;
    constructor(userModel, bookingModel, tripModel, requestModel, userReportModel, redisService) {
        this.userModel = userModel;
        this.bookingModel = bookingModel;
        this.tripModel = tripModel;
        this.requestModel = requestModel;
        this.userReportModel = userReportModel;
        this.redisService = redisService;
    }
    serializeMe(user) {
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
            createdAt: user.get?.('createdAt'),
            authProvider: user.authProvider ?? 'local',
        };
    }
    async getMeProfile(userId) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return this.serializeMe(user);
    }
    async findByEmail(email) {
        return this.userModel.findOne({ email: email.toLowerCase() }).exec();
    }
    async findById(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            return null;
        }
        return this.userModel.findById(id).exec();
    }
    async requireUser(userId) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async generateUniqueReferralCode() {
        for (let attempt = 0; attempt < 8; attempt++) {
            let code = '';
            for (let i = 0; i < 8; i++) {
                code += REFERRAL_CHARS[(0, crypto_1.randomInt)(REFERRAL_CHARS.length)];
            }
            const clash = await this.userModel.exists({ referralCode: code });
            if (!clash)
                return code;
        }
        throw new common_1.ConflictException('Could not allocate referral code');
    }
    async create(data) {
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
    async createGoogleUser(params) {
        const referralCode = await this.generateUniqueReferralCode();
        const oauthPlaceholderPw = `${(0, crypto_1.randomUUID)()}:${(0, crypto_1.randomUUID)()}`;
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
    async updateGoogleId(userId, googleId) {
        await this.userModel
            .updateOne({ _id: userId }, { $set: { googleId, authProvider: 'google' } })
            .exec();
    }
    async findByGoogleId(googleId) {
        return this.userModel.findOne({ googleId }).exec();
    }
    async updateProfile(userId, dto) {
        const user = await this.requireUser(userId);
        if (dto.fullName !== undefined)
            user.fullName = dto.fullName.trim();
        if (dto.bio !== undefined)
            user.bio = dto.bio?.trim();
        if (dto.location !== undefined)
            user.location = dto.location?.trim();
        if (dto.languages !== undefined)
            user.languages = dto.languages;
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
    async updateRefreshTokenHash(userId, hash) {
        if (hash === null) {
            await this.userModel
                .findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } })
                .exec();
        }
        else {
            await this.userModel
                .findByIdAndUpdate(userId, { $set: { refreshTokenHash: hash } })
                .exec();
        }
    }
    async setOtp(userId, code, expiry) {
        await this.userModel
            .findByIdAndUpdate(userId, {
            $set: { otpCode: code, otpExpiry: expiry },
        })
            .exec();
    }
    async clearOtpFields(userId) {
        await this.userModel
            .findByIdAndUpdate(userId, {
            $unset: { otpCode: 1, otpExpiry: 1 },
        })
            .exec();
    }
    async updatePasswordHash(userId, passwordHash) {
        await this.userModel
            .findByIdAndUpdate(userId, {
            $set: { passwordHash },
        })
            .exec();
    }
    async setPasswordFromPlain(userId, plain) {
        const passwordHash = await bcrypt.hash(plain, SALT_ROUNDS);
        await this.updatePasswordHash(userId, passwordHash);
    }
    async comparePassword(plain, passwordHash) {
        return bcrypt.compare(plain, passwordHash);
    }
    async hashRefreshToken(token) {
        return bcrypt.hash(token, SALT_ROUNDS);
    }
    async compareRefreshToken(plainToken, storedHash) {
        if (!storedHash)
            return false;
        return bcrypt.compare(plainToken, storedHash);
    }
    async updateRatingSummary(userId, rating, reviewCount) {
        await this.userModel
            .updateOne({ _id: userId }, { $set: { rating, reviewCount } })
            .exec();
    }
    async setVerificationFlag(userId, field) {
        const key = field === 'email'
            ? 'isEmailVerified'
            : field === 'phone'
                ? 'isPhoneVerified'
                : field === 'id'
                    ? 'isIdVerified'
                    : 'isSelfieVerified';
        return this.userModel
            .findByIdAndUpdate(userId, { $set: { [key]: true } }, { new: true })
            .exec();
    }
    requestCollection() {
        return this.requestModel.collection.name;
    }
    async completedBookingsParticipantCount(userId) {
        const oid = new mongoose_2.Types.ObjectId(userId);
        return this.bookingModel.countDocuments({
            status: 'completed',
            $or: [{ travelerId: oid }, { requesterId: oid }],
        });
    }
    async supportDeliveriesTravelerCount(userId) {
        const oid = new mongoose_2.Types.ObjectId(userId);
        const rows = await this.bookingModel
            .aggregate([
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
    async getPublicProfile(userId) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
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
            createdAt: user.get?.('createdAt'),
            isEmailVerified: !!user.isEmailVerified,
            isPhoneVerified: !!user.isPhoneVerified,
            isIdVerified: !!user.isIdVerified,
            isSelfieVerified: !!user.isSelfieVerified,
            completedBookingsCount,
            supportDeliveriesCount,
        };
    }
    async aggregateSum(match, field) {
        const rows = await this.bookingModel
            .aggregate([
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
    async getStats(userId) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const oid = new mongoose_2.Types.ObjectId(userId);
        const [totalTrips, activeTrips, totalRequests, completedDeliveries, supportDeliveries, totalEarnings, totalSpent,] = await Promise.all([
            this.tripModel.countDocuments({ travelerId: oid }).exec(),
            this.tripModel
                .countDocuments({ travelerId: oid, status: 'active' })
                .exec(),
            this.requestModel.countDocuments({ requesterId: oid }).exec(),
            this.bookingModel
                .countDocuments({ travelerId: oid, status: 'completed' })
                .exec(),
            this.supportDeliveriesTravelerCount(userId),
            this.aggregateSum({ travelerId: oid, status: 'completed' }, '$travelerPayout'),
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
    async changePassword(userId, dto) {
        if (dto.newPassword !== dto.confirmNewPassword) {
            throw new common_1.BadRequestException('Passwords do not match');
        }
        const user = await this.requireUser(userId);
        const ok = await this.comparePassword(dto.currentPassword, user.passwordHash);
        if (!ok) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        await this.setPasswordFromPlain(userId, dto.newPassword);
        await this.redisService.deleteAllRefreshTokens(userId);
        return { message: 'Password updated. Please log in again.' };
    }
    async changeEmail(userId, dto) {
        const user = await this.requireUser(userId);
        const ok = await this.comparePassword(dto.password, user.passwordHash);
        if (!ok) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        const nextEmail = dto.newEmail.toLowerCase().trim();
        const taken = await this.userModel.findOne({
            email: nextEmail,
            _id: { $ne: user._id },
        });
        if (taken) {
            throw new common_1.ConflictException('Email already in use');
        }
        user.email = nextEmail;
        user.isEmailVerified = false;
        await user.save();
        return { message: 'Email updated. Please verify your new email.' };
    }
    async changePhone(userId, dto) {
        const user = await this.requireUser(userId);
        const ok = await this.comparePassword(dto.password, user.passwordHash);
        if (!ok) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        const nextPhone = dto.newPhoneNumber.trim();
        const taken = await this.userModel.findOne({
            phoneNumber: nextPhone,
            _id: { $ne: user._id },
        });
        if (taken) {
            throw new common_1.ConflictException('Phone number already in use');
        }
        user.phoneNumber = nextPhone;
        user.isPhoneVerified = false;
        await user.save();
        return { message: 'Phone number updated.' };
    }
    async blockUser(actorId, targetUserId) {
        if (actorId === targetUserId) {
            throw new common_1.BadRequestException('Cannot block yourself');
        }
        await this.requireUser(actorId);
        const target = await this.findById(targetUserId);
        if (!target) {
            throw new common_1.NotFoundException('User not found');
        }
        const tid = targetUserId;
        const actor = await this.userModel.findById(actorId).exec();
        if (!actor) {
            throw new common_1.NotFoundException('User not found');
        }
        const blocked = actor.blockedUsers ?? [];
        if (blocked.some((id) => id.toString() === tid)) {
            return;
        }
        blocked.push(new mongoose_2.Types.ObjectId(tid));
        actor.blockedUsers = blocked;
        await actor.save();
    }
    async unblockUser(actorId, targetUserId) {
        await this.requireUser(actorId);
        await this.userModel.updateOne({ _id: actorId }, { $pull: { blockedUsers: new mongoose_2.Types.ObjectId(targetUserId) } });
    }
    async listBlocked(actorId) {
        const user = await this.userModel
            .findById(actorId)
            .populate('blockedUsers', 'fullName profilePhoto')
            .exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const list = (user.blockedUsers ?? []);
        return list.map((u) => ({
            id: u._id.toString(),
            fullName: u.fullName,
            profilePhoto: u.profilePhoto ?? null,
        }));
    }
    async reportUser(reporterId, dto) {
        if (dto.targetUserId === reporterId) {
            throw new common_1.BadRequestException('Cannot report yourself');
        }
        await this.requireUser(reporterId);
        const target = await this.findById(dto.targetUserId);
        if (!target) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.userReportModel.create({
            reporterId: new mongoose_2.Types.ObjectId(reporterId),
            targetUserId: new mongoose_2.Types.ObjectId(dto.targetUserId),
            reason: dto.reason,
            description: dto.description?.trim(),
        });
        return { message: 'Report submitted. Our team will review it.' };
    }
    async addFcmToken(userId, token) {
        await this.requireUser(userId);
        await this.userModel.updateOne({ _id: userId }, { $addToSet: { fcmTokens: token } });
    }
    async removeFcmToken(userId, token) {
        await this.requireUser(userId);
        await this.userModel.updateOne({ _id: userId }, { $pull: { fcmTokens: token } });
    }
    async getFcmTokens(userId) {
        const user = await this.userModel
            .findById(userId)
            .select('fcmTokens')
            .lean()
            .exec();
        return user?.fcmTokens ?? [];
    }
    async cleanInvalidFcmTokens(userId, invalidTokens) {
        if (!invalidTokens.length)
            return;
        await this.userModel.updateOne({ _id: userId }, { $pull: { fcmTokens: { $in: invalidTokens } } });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __param(2, (0, mongoose_1.InjectModel)(trip_schema_1.Trip.name)),
    __param(3, (0, mongoose_1.InjectModel)(request_schema_1.Request.name)),
    __param(4, (0, mongoose_1.InjectModel)(user_report_schema_1.UserReport.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        redis_service_1.RedisService])
], UsersService);
//# sourceMappingURL=users.service.js.map