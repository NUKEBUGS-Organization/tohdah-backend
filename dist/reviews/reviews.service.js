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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const review_schema_1 = require("./schemas/review.schema");
const bookings_service_1 = require("../bookings/bookings.service");
const notifications_service_1 = require("../notifications/notifications.service");
const users_service_1 = require("../users/users.service");
const REVIEWER_POPULATE = {
    path: 'reviewerId',
    select: 'fullName profilePhoto',
};
const REVIEWER_REVIELEE_POPULATE = [
    REVIEWER_POPULATE,
    { path: 'revieweeId', select: 'fullName profilePhoto' },
];
let ReviewsService = class ReviewsService {
    reviewModel;
    bookingsService;
    notificationsService;
    usersService;
    constructor(reviewModel, bookingsService, notificationsService, usersService) {
        this.reviewModel = reviewModel;
        this.bookingsService = bookingsService;
        this.notificationsService = notificationsService;
        this.usersService = usersService;
    }
    notify(p) {
        void p.catch(() => undefined);
    }
    async updateUserRating(userId) {
        const oid = new mongoose_2.Types.ObjectId(userId);
        const agg = await this.reviewModel
            .aggregate([
            { $match: { revieweeId: oid, isVisible: true } },
            {
                $group: {
                    _id: null,
                    avg: { $avg: '$overallRating' },
                    count: { $sum: 1 },
                },
            },
        ])
            .exec();
        const row = agg[0];
        const averageRating = row?.avg != null ? Math.round(row.avg * 100) / 100 : 0;
        const reviewCount = row?.count ?? 0;
        await this.usersService.updateRatingSummary(userId, averageRating, reviewCount);
    }
    async create(userId, dto) {
        const booking = await this.bookingsService.findOneForParty(dto.bookingId, userId);
        if (booking.status !== 'completed') {
            throw new common_1.BadRequestException('Reviews can only be left for completed bookings');
        }
        const requesterOid = booking.requesterId.toString();
        const travelerOid = booking.travelerId.toString();
        const revieweeOid = dto.revieweeId;
        const otherParty = userId === requesterOid
            ? travelerOid
            : userId === travelerOid
                ? requesterOid
                : null;
        if (!otherParty || revieweeOid !== otherParty) {
            throw new common_1.BadRequestException('Invalid reviewee');
        }
        const exists = await this.reviewModel
            .exists({
            bookingId: new mongoose_2.Types.ObjectId(dto.bookingId),
            reviewerId: new mongoose_2.Types.ObjectId(userId),
        })
            .exec();
        if (exists) {
            throw new common_1.ConflictException('You have already reviewed this booking');
        }
        const review = await this.reviewModel.create({
            bookingId: new mongoose_2.Types.ObjectId(dto.bookingId),
            reviewerId: new mongoose_2.Types.ObjectId(userId),
            revieweeId: new mongoose_2.Types.ObjectId(revieweeOid),
            overallRating: dto.overallRating,
            categoryRatings: dto.categoryRatings,
            comment: dto.comment?.trim(),
            isVisible: true,
        });
        await this.updateUserRating(revieweeOid);
        const rid = review._id.toString();
        this.notify(this.notificationsService.createNotification({
            userId: revieweeOid,
            type: 'review_request',
            title: 'You received a review',
            body: `Someone left you a ${dto.overallRating}-star review.`,
            metadata: { bookingId: dto.bookingId, reviewId: rid },
        }));
        const populated = await review.populate(REVIEWER_POPULATE);
        return populated;
    }
    async getReviewsForUser(targetUserId, page, limit) {
        const oid = new mongoose_2.Types.ObjectId(targetUserId);
        const p = Math.max(1, page ?? 1);
        const lim = Math.min(100, Math.max(1, limit ?? 10));
        const skip = (p - 1) * lim;
        const filter = { revieweeId: oid, isVisible: true };
        const [data, total, avgAgg] = await Promise.all([
            this.reviewModel
                .find(filter)
                .populate(REVIEWER_POPULATE)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(lim)
                .exec(),
            this.reviewModel.countDocuments(filter).exec(),
            this.reviewModel
                .aggregate([
                { $match: filter },
                { $group: { _id: null, avg: { $avg: '$overallRating' } } },
            ])
                .exec(),
        ]);
        const avg = avgAgg[0]?.avg;
        const averageRating = avg != null ? Math.round(avg * 100) / 100 : 0;
        return {
            data,
            total,
            page: p,
            limit: lim,
            averageRating,
        };
    }
    async getReviewsForBooking(bookingId, userId) {
        await this.bookingsService.findOneForParty(bookingId, userId);
        return this.reviewModel
            .find({ bookingId: new mongoose_2.Types.ObjectId(bookingId) })
            .populate([...REVIEWER_REVIELEE_POPULATE])
            .sort({ createdAt: 1 })
            .exec();
    }
    async getMyReviews(userId, page, limit) {
        const p = Math.max(1, page ?? 1);
        const lim = Math.min(100, Math.max(1, limit ?? 10));
        const skip = (p - 1) * lim;
        const filter = { reviewerId: new mongoose_2.Types.ObjectId(userId) };
        const [data, total] = await Promise.all([
            this.reviewModel
                .find(filter)
                .populate(REVIEWER_POPULATE)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(lim)
                .exec(),
            this.reviewModel.countDocuments(filter).exec(),
        ]);
        return { data, total, page: p, limit: lim };
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(review_schema_1.Review.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        bookings_service_1.BookingsService,
        notifications_service_1.NotificationsService,
        users_service_1.UsersService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map