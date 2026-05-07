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
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../users/schemas/user.schema");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
const trip_schema_1 = require("../trips/schemas/trip.schema");
const request_schema_1 = require("../requests/schemas/request.schema");
const users_service_1 = require("../users/users.service");
const notifications_service_1 = require("../notifications/notifications.service");
const payments_service_1 = require("../payments/payments.service");
const redis_service_1 = require("../common/redis/redis.service");
function startOfUtcDay(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function startOfUtcWeekMonday(d) {
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    const x = startOfUtcDay(d);
    x.setUTCDate(x.getUTCDate() + diff);
    return x;
}
function endOfUtcMonth(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}
function startOfUtcMonth(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function endOfUtcWeekSunday(d) {
    const start = startOfUtcWeekMonday(d);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);
    return end;
}
let AdminService = AdminService_1 = class AdminService {
    userModel;
    bookingModel;
    tripModel;
    requestModel;
    usersService;
    notificationsService;
    paymentsService;
    redisService;
    logger = new common_1.Logger(AdminService_1.name);
    constructor(userModel, bookingModel, tripModel, requestModel, usersService, notificationsService, paymentsService, redisService) {
        this.userModel = userModel;
        this.bookingModel = bookingModel;
        this.tripModel = tripModel;
        this.requestModel = requestModel;
        this.usersService = usersService;
        this.notificationsService = notificationsService;
        this.paymentsService = paymentsService;
        this.redisService = redisService;
    }
    requestCollection() {
        return this.requestModel.collection.name;
    }
    async getPlatformStats() {
        const now = new Date();
        const dayStart = startOfUtcDay(now);
        const weekStart = startOfUtcWeekMonday(now);
        const monthStart = startOfUtcMonth(now);
        const monthEnd = endOfUtcMonth(now);
        const weekEnd = endOfUtcWeekSunday(now);
        const [usersTotal, usersNewToday, usersNewThisWeek, travelers, requesters, verifiedEmail, tripsTotal, tripsActive, tripsCompleted, tripsCancelled, requestsTotal, requestsPending, requestsStandard, requestsSupport, requestsCompleted, bookingsTotal, bookingsActive, bookingsCompleted, bookingsDisputed, bookingsCancelled, revenueTotalRows, revenueMonthRows, revenueWeekRows, supportRequestsTotal, supportRequestsFulfilled, volunteerRows, elderlyAssisted, communityChampions,] = await Promise.all([
            this.userModel.countDocuments().exec(),
            this.userModel.countDocuments({ createdAt: { $gte: dayStart } }).exec(),
            this.userModel.countDocuments({ createdAt: { $gte: weekStart } }).exec(),
            this.userModel
                .countDocuments({
                $or: [{ accountType: 'traveler' }, { accountType: 'both' }],
            })
                .exec(),
            this.userModel
                .countDocuments({
                $or: [{ accountType: 'requester' }, { accountType: 'both' }],
            })
                .exec(),
            this.userModel.countDocuments({ isEmailVerified: true }).exec(),
            this.tripModel.countDocuments().exec(),
            this.tripModel.countDocuments({ status: 'active' }).exec(),
            this.tripModel.countDocuments({ status: 'completed' }).exec(),
            this.tripModel.countDocuments({ status: 'cancelled' }).exec(),
            this.requestModel.countDocuments().exec(),
            this.requestModel.countDocuments({ status: 'pending' }).exec(),
            this.requestModel.countDocuments({ type: 'standard' }).exec(),
            this.requestModel.countDocuments({ type: 'support' }).exec(),
            this.requestModel.countDocuments({ status: 'completed' }).exec(),
            this.bookingModel.countDocuments().exec(),
            this.bookingModel
                .countDocuments({
                status: { $in: ['confirmed', 'paid', 'in_transit'] },
            })
                .exec(),
            this.bookingModel.countDocuments({ status: 'completed' }).exec(),
            this.bookingModel.countDocuments({ status: 'disputed' }).exec(),
            this.bookingModel.countDocuments({ status: 'cancelled' }).exec(),
            this.bookingModel
                .aggregate([
                { $match: { status: 'completed' } },
                {
                    $group: {
                        _id: null,
                        s: { $sum: { $ifNull: ['$platformCommission', 0] } },
                    },
                },
            ])
                .exec(),
            this.bookingModel
                .aggregate([
                {
                    $match: {
                        status: 'completed',
                        $or: [
                            {
                                completedAt: {
                                    $gte: monthStart,
                                    $lte: monthEnd,
                                },
                            },
                            {
                                completedAt: { $exists: false },
                                updatedAt: { $gte: monthStart, $lte: monthEnd },
                            },
                        ],
                    },
                },
                {
                    $group: {
                        _id: null,
                        s: { $sum: { $ifNull: ['$platformCommission', 0] } },
                    },
                },
            ])
                .exec(),
            this.bookingModel
                .aggregate([
                {
                    $match: {
                        status: 'completed',
                        $or: [
                            {
                                completedAt: {
                                    $gte: weekStart,
                                    $lte: weekEnd,
                                },
                            },
                            {
                                completedAt: { $exists: false },
                                updatedAt: { $gte: weekStart, $lte: weekEnd },
                            },
                        ],
                    },
                },
                {
                    $group: {
                        _id: null,
                        s: { $sum: { $ifNull: ['$platformCommission', 0] } },
                    },
                },
            ])
                .exec(),
            this.requestModel.countDocuments({ type: 'support' }).exec(),
            this.requestModel
                .countDocuments({ type: 'support', status: 'completed' })
                .exec(),
            this.bookingModel
                .aggregate([
                { $match: { status: 'completed' } },
                {
                    $lookup: {
                        from: this.requestCollection(),
                        localField: 'requestId',
                        foreignField: '_id',
                        as: 'rq',
                    },
                },
                { $unwind: '$rq' },
                { $match: { 'rq.paymentType': 'volunteer' } },
                { $count: 'n' },
            ])
                .exec(),
            this.requestModel
                .countDocuments({
                type: 'support',
                beneficiaryType: 'elderly',
                status: 'completed',
            })
                .exec(),
            this.bookingModel
                .aggregate([
                { $match: { status: 'completed' } },
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
                { $group: { _id: '$travelerId', c: { $sum: 1 } } },
                { $match: { c: { $gte: 5 } } },
                { $count: 'n' },
            ])
                .exec(),
        ]);
        return {
            users: {
                total: usersTotal,
                newToday: usersNewToday,
                newThisWeek: usersNewThisWeek,
                travelers,
                requesters,
                verified: verifiedEmail,
            },
            trips: {
                total: tripsTotal,
                active: tripsActive,
                completed: tripsCompleted,
                cancelled: tripsCancelled,
            },
            requests: {
                total: requestsTotal,
                pending: requestsPending,
                standard: requestsStandard,
                support: requestsSupport,
                completed: requestsCompleted,
            },
            bookings: {
                total: bookingsTotal,
                active: bookingsActive,
                completed: bookingsCompleted,
                disputed: bookingsDisputed,
                cancelled: bookingsCancelled,
            },
            revenue: {
                totalCommission: revenueTotalRows[0]?.s ?? 0,
                thisMonth: revenueMonthRows[0]?.s ?? 0,
                thisWeek: revenueWeekRows[0]?.s ?? 0,
            },
            impact: {
                supportRequestsTotal,
                supportRequestsFulfilled,
                volunteerDeliveries: volunteerRows[0]?.n ?? 0,
                elderlyAssisted,
                communityChampions: communityChampions[0]?.n ?? 0,
            },
        };
    }
    targetIsPrivileged(user) {
        const r = user.role ?? 'user';
        return r === 'admin' || r === 'superadmin';
    }
    async suspendUser(actorId, targetUserId, reason) {
        const target = await this.usersService.findById(targetUserId);
        if (!target)
            throw new common_1.NotFoundException('User not found');
        if (this.targetIsPrivileged(target)) {
            throw new common_1.ForbiddenException('Cannot suspend an administrator');
        }
        target.accountStatus = 'suspended';
        target.suspensionReason = reason;
        target.suspendedAt = new Date();
        await target.save();
        return { message: 'User suspended', userId: targetUserId };
    }
    async banUser(actorId, targetUserId, reason) {
        const target = await this.usersService.findById(targetUserId);
        if (!target)
            throw new common_1.NotFoundException('User not found');
        if (this.targetIsPrivileged(target)) {
            throw new common_1.ForbiddenException('Cannot ban an administrator');
        }
        target.accountStatus = 'banned';
        target.suspensionReason = reason;
        target.bannedAt = new Date();
        await target.save();
        await this.redisService.deleteAllRefreshTokens(targetUserId);
        return { message: 'User banned', userId: targetUserId };
    }
    async reinstateUser(_actorId, targetUserId) {
        const target = await this.usersService.findById(targetUserId);
        if (!target)
            throw new common_1.NotFoundException('User not found');
        target.accountStatus = 'active';
        target.suspensionReason = undefined;
        target.suspendedAt = undefined;
        target.bannedAt = undefined;
        await target.save();
        return { message: 'User reinstated', userId: targetUserId };
    }
    async updateUserRole(_actorId, targetUserId, role) {
        const target = await this.usersService.findById(targetUserId);
        if (!target)
            throw new common_1.NotFoundException('User not found');
        if (role !== 'user' && role !== 'admin') {
            throw new common_1.BadRequestException('Invalid role');
        }
        target.role = role;
        await target.save();
        return { message: 'Role updated', userId: targetUserId, role };
    }
    async listUsers(query) {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;
        const filter = {};
        if (query.search?.trim()) {
            const rx = new RegExp(query.search.trim(), 'i');
            filter.$or = [{ fullName: rx }, { email: rx }];
        }
        if (query.role === 'user') {
            filter.role = 'user';
        }
        else if (query.role === 'admin') {
            filter.role = { $in: ['admin', 'superadmin'] };
        }
        if (query.accountType) {
            filter.accountType = query.accountType;
        }
        if (query.status) {
            filter.accountStatus = query.status;
        }
        if (query.isVerified === true) {
            filter.isEmailVerified = true;
        }
        else if (query.isVerified === false) {
            filter.isEmailVerified = false;
        }
        if (query.dateFrom || query.dateTo) {
            filter.createdAt = {};
            if (query.dateFrom) {
                filter.createdAt.$gte = new Date(query.dateFrom);
            }
            if (query.dateTo) {
                filter.createdAt.$lte = new Date(query.dateTo);
            }
        }
        const [rows, total] = await Promise.all([
            this.userModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('fullName email phoneNumber role accountType isEmailVerified isPhoneVerified isIdVerified rating reviewCount accountStatus createdAt')
                .lean()
                .exec(),
            this.userModel.countDocuments(filter).exec(),
        ]);
        const data = rows.map((u) => ({
            id: String(u._id),
            fullName: u.fullName,
            email: u.email,
            phoneNumber: u.phoneNumber,
            role: u.role ?? 'user',
            accountType: u.accountType ?? null,
            isEmailVerified: !!u.isEmailVerified,
            isPhoneVerified: !!u.isPhoneVerified,
            isIdVerified: !!u.isIdVerified,
            rating: Number(u.rating ?? 0),
            reviewCount: Number(u.reviewCount ?? 0),
            accountStatus: u.accountStatus ?? 'active',
            createdAt: u.createdAt,
        }));
        return { data, total, page, limit };
    }
    serializeUserDetail(user) {
        const o = user.toObject();
        delete o.passwordHash;
        delete o.refreshTokenHash;
        delete o.otpCode;
        delete o.otpExpiry;
        o._id = user._id;
        return o;
    }
    async getUserDetail(userId) {
        const user = await this.usersService.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const [stats, recentBookings, recentTrips, recentRequests,] = await Promise.all([
            this.usersService.getStats(userId),
            this.bookingModel
                .find({
                $or: [
                    { requesterId: user._id },
                    { travelerId: user._id },
                ],
            })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('_id status createdAt')
                .lean()
                .exec(),
            this.tripModel
                .find({ travelerId: user._id })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('_id status createdAt')
                .lean()
                .exec(),
            this.requestModel
                .find({ requesterId: user._id })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('_id status createdAt')
                .lean()
                .exec(),
        ]);
        return {
            user: this.serializeUserDetail(user),
            stats,
            recentActivity: {
                bookings: recentBookings.map((b) => ({
                    id: String(b._id),
                    status: b.status,
                    createdAt: b.createdAt,
                })),
                trips: recentTrips.map((t) => ({
                    id: String(t._id),
                    status: t.status,
                    createdAt: t.createdAt,
                })),
                requests: recentRequests.map((r) => ({
                    id: String(r._id),
                    status: r.status,
                    createdAt: r.createdAt,
                })),
            },
        };
    }
    async listTrips(query) {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;
        const filter = {};
        if (query.status)
            filter.status = query.status;
        if (query.origin?.trim()) {
            filter.origin = new RegExp(query.origin.trim(), 'i');
        }
        if (query.destination?.trim()) {
            filter.destination = new RegExp(query.destination.trim(), 'i');
        }
        if (query.travelerId && mongoose_2.Types.ObjectId.isValid(query.travelerId)) {
            filter.travelerId = new mongoose_2.Types.ObjectId(query.travelerId);
        }
        if (query.dateFrom || query.dateTo) {
            filter.createdAt = {};
            if (query.dateFrom)
                filter.createdAt.$gte = new Date(query.dateFrom);
            if (query.dateTo)
                filter.createdAt.$lte = new Date(query.dateTo);
        }
        const [data, total] = await Promise.all([
            this.tripModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('travelerId', 'fullName email profilePhoto')
                .exec(),
            this.tripModel.countDocuments(filter).exec(),
        ]);
        return { data, total, page, limit };
    }
    async listRequests(query) {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;
        const filter = {};
        if (query.status)
            filter.status = query.status;
        if (query.type)
            filter.type = query.type;
        if (query.urgencyLevel)
            filter.urgencyLevel = query.urgencyLevel;
        if (query.origin?.trim())
            filter.origin = new RegExp(query.origin.trim(), 'i');
        if (query.destination?.trim()) {
            filter.destination = new RegExp(query.destination.trim(), 'i');
        }
        if (query.requesterId && mongoose_2.Types.ObjectId.isValid(query.requesterId)) {
            filter.requesterId = new mongoose_2.Types.ObjectId(query.requesterId);
        }
        const [data, total] = await Promise.all([
            this.requestModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('requesterId', 'fullName email profilePhoto')
                .exec(),
            this.requestModel.countDocuments(filter).exec(),
        ]);
        return { data, total, page, limit };
    }
    async listBookings(query) {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;
        const filter = {};
        if (query.status)
            filter.status = query.status;
        if (query.travelerId && mongoose_2.Types.ObjectId.isValid(query.travelerId)) {
            filter.travelerId = new mongoose_2.Types.ObjectId(query.travelerId);
        }
        if (query.requesterId && mongoose_2.Types.ObjectId.isValid(query.requesterId)) {
            filter.requesterId = new mongoose_2.Types.ObjectId(query.requesterId);
        }
        if (query.dateFrom || query.dateTo) {
            filter.createdAt = {};
            if (query.dateFrom)
                filter.createdAt.$gte = new Date(query.dateFrom);
            if (query.dateTo)
                filter.createdAt.$lte = new Date(query.dateTo);
        }
        const [data, total] = await Promise.all([
            this.bookingModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('requesterId', 'fullName email profilePhoto')
                .populate('travelerId', 'fullName email profilePhoto')
                .exec(),
            this.bookingModel.countDocuments(filter).exec(),
        ]);
        return { data, total, page, limit };
    }
    async listDisputes(query) {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;
        const filter = { status: 'disputed' };
        if (query.dateFrom || query.dateTo) {
            filter.disputeRaisedAt = {};
            if (query.dateFrom) {
                filter.disputeRaisedAt.$gte = new Date(query.dateFrom);
            }
            if (query.dateTo) {
                filter.disputeRaisedAt.$lte = new Date(query.dateTo);
            }
        }
        const [data, total] = await Promise.all([
            this.bookingModel
                .find(filter)
                .sort({ disputeRaisedAt: 1 })
                .skip(skip)
                .limit(limit)
                .populate('requesterId', 'fullName email profilePhoto')
                .populate('travelerId', 'fullName email profilePhoto')
                .populate('requestId')
                .populate('tripId')
                .exec(),
            this.bookingModel.countDocuments(filter).exec(),
        ]);
        return { data, total, page, limit };
    }
    async resolveDispute(adminUserId, bookingId, dto) {
        if (dto.resolution === 'partial_refund') {
            if (dto.refundAmount === undefined || dto.refundAmount === null) {
                throw new common_1.BadRequestException('refundAmount is required for partial_refund');
            }
        }
        const booking = await this.bookingModel.findById(bookingId).exec();
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.status !== 'disputed') {
            throw new common_1.BadRequestException('Booking is not in disputed status');
        }
        booking.disputeResolution = dto.notes;
        booking.disputeResolvedAt = new Date();
        booking.disputeResolvedBy = new mongoose_2.Types.ObjectId(adminUserId);
        switch (dto.resolution) {
            case 'refund_requester': {
                const amt = dto.refundAmount ??
                    booking.agreedFee ??
                    booking.counterFee ??
                    booking.offeredFee;
                booking.refundAmount = amt;
                booking.status = 'cancelled';
                break;
            }
            case 'partial_refund': {
                booking.refundAmount = dto.refundAmount;
                booking.status = 'cancelled';
                break;
            }
            case 'release_traveler': {
                booking.status = 'completed';
                booking.completedAt = booking.completedAt ?? new Date();
                break;
            }
            case 'no_action': {
                booking.status = 'completed';
                booking.completedAt = booking.completedAt ?? new Date();
                break;
            }
            default:
                throw new common_1.BadRequestException('Invalid resolution');
        }
        if ((dto.resolution === 'partial_refund' ||
            dto.resolution === 'refund_requester') &&
            booking.paymentIntentId) {
            let refundDollars;
            if (dto.resolution === 'partial_refund') {
                refundDollars = dto.refundAmount;
            }
            else if (dto.refundAmount !== undefined &&
                dto.refundAmount !== null) {
                refundDollars = dto.refundAmount;
            }
            try {
                await this.paymentsService.refundPayment({
                    paymentIntentId: booking.paymentIntentId,
                    amount: refundDollars,
                });
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                throw new common_1.BadRequestException(`Stripe refund failed: ${msg}`);
            }
        }
        else if ((dto.resolution === 'partial_refund' ||
            dto.resolution === 'refund_requester') &&
            !booking.paymentIntentId) {
            this.logger.warn(`Dispute ${bookingId} resolved with refund but no paymentIntentId; skipping Stripe`);
        }
        await booking.save();
        return { message: 'Dispute resolved', booking };
    }
    async listSupportRequests(query) {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;
        const filter = { type: 'support' };
        if (query.adminApprovalStatus) {
            filter.adminApprovalStatus = query.adminApprovalStatus;
        }
        if (query.urgencyLevel)
            filter.urgencyLevel = query.urgencyLevel;
        if (query.status)
            filter.status = query.status;
        const urgencyRank = {
            $switch: {
                branches: [
                    { case: { $eq: ['$urgencyLevel', 'critical'] }, then: 4 },
                    { case: { $eq: ['$urgencyLevel', 'high'] }, then: 3 },
                    { case: { $eq: ['$urgencyLevel', 'medium'] }, then: 2 },
                    { case: { $eq: ['$urgencyLevel', 'low'] }, then: 1 },
                ],
                default: 0,
            },
        };
        const usersColl = this.userModel.collection.name;
        const pipeline = [
            { $match: filter },
            { $addFields: { _urgencyRank: urgencyRank } },
            { $sort: { _urgencyRank: -1, createdAt: 1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: usersColl,
                    localField: 'requesterId',
                    foreignField: '_id',
                    as: 'requesterId',
                },
            },
            {
                $unwind: {
                    path: '$requesterId',
                    preserveNullAndEmptyArrays: true,
                },
            },
        ];
        const [data, total] = await Promise.all([
            this.requestModel.aggregate(pipeline).exec(),
            this.requestModel.countDocuments(filter).exec(),
        ]);
        return { data, total, page, limit };
    }
    async approveSupportRequest(adminUserId, requestId, notes) {
        const doc = await this.requestModel.findById(requestId).exec();
        if (!doc)
            throw new common_1.NotFoundException('Request not found');
        if (doc.type !== 'support') {
            throw new common_1.BadRequestException('Not a support request');
        }
        doc.adminApprovalStatus = 'approved';
        doc.adminApprovalNotes = notes?.trim();
        doc.adminReviewedBy = new mongoose_2.Types.ObjectId(adminUserId);
        doc.adminReviewedAt = new Date();
        await doc.save();
        await this.notificationsService.createNotification({
            userId: doc.requesterId,
            type: 'support_request_approved',
            title: 'Your support request was approved',
            body: 'Your community support request has been approved and is now visible to travelers.',
            metadata: { requestId },
        });
        return { message: 'Request approved', request: doc };
    }
    async rejectSupportRequest(adminUserId, requestId, notes) {
        const doc = await this.requestModel.findById(requestId).exec();
        if (!doc)
            throw new common_1.NotFoundException('Request not found');
        if (doc.type !== 'support') {
            throw new common_1.BadRequestException('Not a support request');
        }
        doc.adminApprovalStatus = 'rejected';
        doc.adminApprovalNotes = notes.trim();
        doc.adminReviewedBy = new mongoose_2.Types.ObjectId(adminUserId);
        doc.adminReviewedAt = new Date();
        doc.status = 'cancelled';
        await doc.save();
        return { message: 'Request rejected', request: doc };
    }
    impactDateFilter(dateFrom, dateTo) {
        if (!dateFrom && !dateTo)
            return undefined;
        const q = {};
        if (dateFrom)
            q.$gte = new Date(dateFrom);
        if (dateTo)
            q.$lte = new Date(dateTo);
        return { createdAt: q };
    }
    rqCreatedRangeStage(dateFrom, dateTo) {
        if (!dateFrom && !dateTo)
            return null;
        const q = {};
        if (dateFrom)
            q.$gte = new Date(dateFrom);
        if (dateTo)
            q.$lte = new Date(dateTo);
        return { $match: { 'rq.createdAt': q } };
    }
    async getImpact(query) {
        const rf = this.impactDateFilter(query.dateFrom, query.dateTo);
        const reqMatch = { type: 'support' };
        if (rf)
            Object.assign(reqMatch, rf);
        const rqDate = this.rqCreatedRangeStage(query.dateFrom, query.dateTo);
        const [supportRequestsTotal, supportRequestsFulfilled, volunteerDeliveriesAgg, elderlyAssisted, communityChampionsAgg, byType, byPaymentType, topTravelersAgg,] = await Promise.all([
            this.requestModel.countDocuments(reqMatch).exec(),
            this.requestModel
                .countDocuments({
                ...reqMatch,
                status: 'completed',
            })
                .exec(),
            this.bookingModel
                .aggregate([
                { $match: { status: 'completed' } },
                {
                    $lookup: {
                        from: this.requestCollection(),
                        localField: 'requestId',
                        foreignField: '_id',
                        as: 'rq',
                    },
                },
                { $unwind: '$rq' },
                ...(rqDate ? [rqDate] : []),
                {
                    $match: {
                        'rq.paymentType': 'volunteer',
                        'rq.type': 'support',
                    },
                },
                { $count: 'n' },
            ])
                .exec(),
            this.requestModel
                .countDocuments({
                ...reqMatch,
                beneficiaryType: 'elderly',
                status: 'completed',
            })
                .exec(),
            this.bookingModel
                .aggregate([
                { $match: { status: 'completed' } },
                {
                    $lookup: {
                        from: this.requestCollection(),
                        localField: 'requestId',
                        foreignField: '_id',
                        as: 'rq',
                    },
                },
                { $unwind: '$rq' },
                ...(rqDate ? [rqDate] : []),
                { $match: { 'rq.type': 'support' } },
                { $group: { _id: '$travelerId', c: { $sum: 1 } } },
                { $match: { c: { $gte: 5 } } },
                { $count: 'n' },
            ])
                .exec(),
            this.requestModel
                .aggregate([
                { $match: reqMatch },
                {
                    $group: {
                        _id: '$beneficiaryType',
                        count: { $sum: 1 },
                        fulfilled: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        type: { $ifNull: ['$_id', 'unknown'] },
                        count: 1,
                        fulfilled: 1,
                    },
                },
            ])
                .exec(),
            this.requestModel
                .aggregate([
                { $match: { ...reqMatch, paymentType: { $exists: true } } },
                {
                    $group: {
                        _id: '$paymentType',
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        paymentType: '$_id',
                        count: 1,
                    },
                },
            ])
                .exec(),
            this.bookingModel
                .aggregate([
                { $match: { status: 'completed' } },
                {
                    $lookup: {
                        from: this.requestCollection(),
                        localField: 'requestId',
                        foreignField: '_id',
                        as: 'rq',
                    },
                },
                { $unwind: '$rq' },
                ...(rqDate ? [rqDate] : []),
                { $match: { 'rq.type': 'support' } },
                {
                    $group: {
                        _id: '$travelerId',
                        supportDeliveries: { $sum: 1 },
                    },
                },
                { $sort: { supportDeliveries: -1 } },
                { $limit: 10 },
            ])
                .exec(),
        ]);
        const travelerIds = topTravelersAgg.map((t) => t._id);
        const profiles = travelerIds.length > 0
            ? await this.userModel
                .find({ _id: { $in: travelerIds } })
                .select('fullName profilePhoto')
                .lean()
                .exec()
            : [];
        const profileMap = new Map(profiles.map((p) => [String(p._id), p]));
        const topTravelers = topTravelersAgg.map((t) => {
            const p = profileMap.get(String(t._id));
            return {
                travelerId: String(t._id),
                fullName: p?.fullName ?? '',
                profilePhoto: p?.profilePhoto ?? null,
                supportDeliveries: t.supportDeliveries,
            };
        });
        return {
            overview: {
                supportRequestsTotal,
                supportRequestsFulfilled,
                volunteerDeliveries: volunteerDeliveriesAgg[0]?.n ?? 0,
                elderlyAssisted,
                communityChampions: communityChampionsAgg[0]?.n ?? 0,
            },
            byType: byType.map((b) => ({
                type: String(b.type),
                count: b.count,
                fulfilled: b.fulfilled,
            })),
            byPaymentType: byPaymentType.map((b) => ({
                paymentType: String(b.paymentType),
                count: b.count,
            })),
            topTravelers,
        };
    }
    async listReferrals(query) {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;
        const filter = {
            referredBy: { $exists: true, $ne: null },
        };
        const [rows, total] = await Promise.all([
            this.userModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('referredBy', 'fullName email')
                .lean()
                .exec(),
            this.userModel.countDocuments(filter).exec(),
        ]);
        const data = rows.map((u) => ({
            id: String(u._id),
            fullName: u.fullName,
            email: u.email,
            loyaltyPoints: u.loyaltyPoints ?? 0,
            createdAt: u.createdAt,
            referredBy: u.referredBy,
        }));
        return { data, total, page, limit };
    }
    async getLoyaltyOverview() {
        const [tierRows, topUsers] = await Promise.all([
            this.userModel
                .aggregate([
                {
                    $group: {
                        _id: { $ifNull: ['$loyaltyTier', 'bronze'] },
                        count: { $sum: 1 },
                    },
                },
            ])
                .exec(),
            this.userModel
                .find()
                .sort({ loyaltyPoints: -1 })
                .limit(10)
                .select('fullName email loyaltyPoints')
                .lean()
                .exec(),
        ]);
        const tierMap = new Map(tierRows.map((r) => [r._id, r.count]));
        const tiers = ['bronze', 'silver', 'gold'].map((tier) => ({
            tier,
            count: tierMap.get(tier) ?? 0,
        }));
        return {
            tiers,
            topUsers: topUsers.map((u) => ({
                fullName: u.fullName,
                email: u.email,
                points: u.loyaltyPoints ?? 0,
            })),
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __param(2, (0, mongoose_1.InjectModel)(trip_schema_1.Trip.name)),
    __param(3, (0, mongoose_1.InjectModel)(request_schema_1.Request.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        users_service_1.UsersService,
        notifications_service_1.NotificationsService,
        payments_service_1.PaymentsService,
        redis_service_1.RedisService])
], AdminService);
//# sourceMappingURL=admin.service.js.map