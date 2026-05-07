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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const message_schema_1 = require("./schemas/message.schema");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
const bookings_service_1 = require("../bookings/bookings.service");
const notifications_service_1 = require("../notifications/notifications.service");
const SENDER_POPULATE = [
    {
        path: 'senderId',
        select: 'fullName profilePhoto',
    },
];
const BOOKING_SUMMARY_POPULATE = [
    { path: 'requesterId', select: 'fullName profilePhoto' },
    { path: 'travelerId', select: 'fullName profilePhoto' },
];
let ChatService = class ChatService {
    messageModel;
    bookingModel;
    bookingsService;
    notificationsService;
    constructor(messageModel, bookingModel, bookingsService, notificationsService) {
        this.messageModel = messageModel;
        this.bookingModel = bookingModel;
        this.bookingsService = bookingsService;
        this.notificationsService = notificationsService;
    }
    notifyAsync(p) {
        void p.catch(() => undefined);
    }
    previewBody(content) {
        if (content.length <= 80)
            return content;
        return `${content.slice(0, 80)}...`;
    }
    async sendMessage(userId, bookingId, dto) {
        const booking = await this.bookingsService.findOneForParty(bookingId, userId);
        if (booking.status === 'cancelled') {
            throw new common_1.BadRequestException('Cannot message on a cancelled booking');
        }
        const receiverId = userId === booking.requesterId.toString()
            ? booking.travelerId
            : booking.requesterId;
        const msg = await this.messageModel.create({
            bookingId: new mongoose_2.Types.ObjectId(bookingId),
            senderId: new mongoose_2.Types.ObjectId(userId),
            receiverId,
            content: dto.content.trim(),
            imageUrl: dto.imageUrl?.trim(),
        });
        const populated = await msg.populate([...SENDER_POPULATE]);
        this.notifyAsync(this.notificationsService.createNotification({
            userId: receiverId.toString(),
            type: 'new_message',
            title: 'New message',
            body: this.previewBody(dto.content.trim()),
            metadata: {
                bookingId,
                messageId: populated._id.toString(),
            },
        }));
        return populated;
    }
    async getMessages(userId, bookingId, page, limit) {
        await this.bookingsService.findOneForParty(bookingId, userId);
        const oid = new mongoose_2.Types.ObjectId(bookingId);
        const uid = new mongoose_2.Types.ObjectId(userId);
        await this.messageModel
            .updateMany({ bookingId: oid, receiverId: uid, isRead: false }, { $set: { isRead: true, readAt: new Date() } })
            .exec();
        const p = Math.max(1, page ?? 1);
        const lim = Math.min(200, Math.max(1, limit ?? 50));
        const skip = (p - 1) * lim;
        const [data, total] = await Promise.all([
            this.messageModel
                .find({ bookingId: oid })
                .populate([...SENDER_POPULATE])
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(lim)
                .exec(),
            this.messageModel.countDocuments({ bookingId: oid }).exec(),
        ]);
        return { data, total, page: p, limit: lim };
    }
    async getMyConversations(userId) {
        const userOid = new mongoose_2.Types.ObjectId(userId);
        const grouped = await this.messageModel
            .aggregate([
            {
                $match: {
                    $or: [{ senderId: userOid }, { receiverId: userOid }],
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$bookingId',
                    lastMessage: { $first: '$$ROOT' },
                },
            },
            { $sort: { 'lastMessage.createdAt': -1 } },
        ])
            .exec();
        if (grouped.length === 0) {
            return [];
        }
        const bookingIds = grouped.map((g) => g._id);
        const unreadAgg = await this.messageModel
            .aggregate([
            {
                $match: {
                    bookingId: { $in: bookingIds },
                    receiverId: userOid,
                    isRead: false,
                },
            },
            { $group: { _id: '$bookingId', unreadCount: { $sum: 1 } } },
        ])
            .exec();
        const unreadMap = new Map(unreadAgg.map((row) => [row._id.toString(), row.unreadCount]));
        const bookings = await this.bookingModel
            .find({ _id: { $in: bookingIds } })
            .populate([...BOOKING_SUMMARY_POPULATE])
            .lean()
            .exec();
        const bookingById = new Map(bookings.map((b) => [b._id.toString(), b]));
        return grouped.map((g) => {
            const bid = g._id.toString();
            const lm = g.lastMessage;
            const lastMessageLean = {
                _id: lm._id,
                bookingId: lm.bookingId,
                senderId: lm.senderId,
                receiverId: lm.receiverId,
                content: lm.content,
                imageUrl: lm.imageUrl,
                isRead: lm.isRead,
                readAt: lm.readAt,
                createdAt: lm.createdAt,
                updatedAt: lm.updatedAt,
            };
            return {
                booking: bookingById.get(bid) ?? null,
                bookingRef: bookingById.get(bid)?.bookingRef,
                lastMessage: lastMessageLean,
                unreadCount: unreadMap.get(bid) ?? 0,
            };
        });
    }
    async markMessageRead(userId, messageId) {
        if (!mongoose_2.Types.ObjectId.isValid(messageId)) {
            throw new common_1.NotFoundException('Message not found');
        }
        const msg = await this.messageModel.findById(messageId).exec();
        if (!msg) {
            throw new common_1.NotFoundException('Message not found');
        }
        if (msg.receiverId.toString() !== userId) {
            throw new common_1.ForbiddenException('Only the receiver can mark this message read');
        }
        msg.isRead = true;
        msg.readAt = new Date();
        return msg.save();
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(message_schema_1.Message.name)),
    __param(1, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        bookings_service_1.BookingsService,
        notifications_service_1.NotificationsService])
], ChatService);
//# sourceMappingURL=chat.service.js.map