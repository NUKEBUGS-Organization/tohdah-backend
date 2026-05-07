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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
const request_schema_1 = require("../requests/schemas/request.schema");
const users_service_1 = require("../users/users.service");
let TrustService = class TrustService {
    usersService;
    bookingModel;
    requestModel;
    constructor(usersService, bookingModel, requestModel) {
        this.usersService = usersService;
        this.bookingModel = bookingModel;
        this.requestModel = requestModel;
    }
    line(earned, pts) {
        return { earned, points: earned ? pts : 0 };
    }
    calculateTrustScore(user, completedBookings, supportDeliveries) {
        let raw = 0;
        const emailVerified = !!user.isEmailVerified;
        const emailPts = 15;
        if (emailVerified)
            raw += emailPts;
        const phoneVerified = !!user.isPhoneVerified;
        const phonePts = 15;
        if (phoneVerified)
            raw += phonePts;
        const idVerified = !!user.isIdVerified;
        const idPts = 25;
        if (idVerified)
            raw += idPts;
        const selfieVerified = !!user.isSelfieVerified;
        const selfiePts = 10;
        if (selfieVerified)
            raw += selfiePts;
        const hasPhoto = !!(user.profilePhoto && String(user.profilePhoto).trim().length > 0);
        const hasBio = !!(user.bio && String(user.bio).trim().length > 0);
        const photoPts = hasPhoto ? 5 : 0;
        const bioPts = hasBio ? 5 : 0;
        raw += photoPts + bioPts;
        const profileEarned = hasPhoto || hasBio;
        const profilePoints = photoPts + bioPts;
        const ratingVal = Number(user.rating ?? 0);
        const rc = Number(user.reviewCount ?? 0);
        let ratingPoints = 0;
        if (ratingVal >= 4.0 && rc >= 3) {
            ratingPoints = 15;
        }
        else if (ratingVal >= 3.0 && rc >= 1) {
            ratingPoints = 10;
        }
        raw += ratingPoints;
        const completedPts = completedBookings >= 5 ? 10 : 0;
        raw += completedPts;
        const supportPts = supportDeliveries >= 1 ? 5 : 0;
        raw += supportPts;
        const score = Math.min(100, Math.round(raw));
        const breakdown = {
            emailVerified: this.line(emailVerified, emailPts),
            phoneVerified: this.line(phoneVerified, phonePts),
            idVerified: this.line(idVerified, idPts),
            selfieVerified: this.line(selfieVerified, selfiePts),
            profileComplete: this.line(profileEarned, profilePoints),
            ratingScore: { points: ratingPoints },
            completedBookings: { count: completedBookings, points: completedPts },
            supportDeliveries: { count: supportDeliveries, points: supportPts },
        };
        return { score, breakdown };
    }
    requestCollection() {
        return this.requestModel.collection.name;
    }
    async countCompletedParticipantBookings(userId) {
        const oid = new mongoose_2.Types.ObjectId(userId);
        return this.bookingModel.countDocuments({
            status: 'completed',
            $or: [{ requesterId: oid }, { travelerId: oid }],
        });
    }
    async countCompletedSupportDeliveries(travelerId) {
        const oid = new mongoose_2.Types.ObjectId(travelerId);
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
    async getTrustResult(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const completed = await this.countCompletedParticipantBookings(userId);
        const supportDel = await this.countCompletedSupportDeliveries(userId);
        return this.calculateTrustScore(user, completed, supportDel);
    }
    async verifyFieldStub(userId, field) {
        const updated = await this.usersService.setVerificationFlag(userId, field);
        if (!updated) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.getTrustResult(userId);
    }
    async getBadges(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const completed = await this.countCompletedParticipantBookings(userId);
        const supportDeliveries = await this.countCompletedSupportDeliveries(userId);
        const rating = Number(user.rating ?? 0);
        return [
            {
                badge: 'email_verified',
                earned: !!user.isEmailVerified,
            },
            {
                badge: 'phone_verified',
                earned: !!user.isPhoneVerified,
            },
            {
                badge: 'id_verified',
                earned: !!user.isIdVerified,
            },
            {
                badge: 'selfie_verified',
                earned: !!user.isSelfieVerified,
            },
            {
                badge: 'top_rated',
                earned: rating >= 4.5,
            },
            {
                badge: 'experienced',
                earned: completed >= 10,
            },
            {
                badge: 'community_champion',
                earned: supportDeliveries >= 5,
            },
        ];
    }
};
exports.TrustService = TrustService;
exports.TrustService = TrustService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __param(2, (0, mongoose_1.InjectModel)(request_schema_1.Request.name)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        mongoose_2.Model,
        mongoose_2.Model])
], TrustService);
//# sourceMappingURL=trust.service.js.map