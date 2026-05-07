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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const fcm_service_1 = require("../common/fcm/fcm.service");
const users_service_1 = require("../users/users.service");
const notification_schema_1 = require("./schemas/notification.schema");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    notificationModel;
    fcmService;
    usersService;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(notificationModel, fcmService, usersService) {
        this.notificationModel = notificationModel;
        this.fcmService = fcmService;
        this.usersService = usersService;
    }
    async createNotification(payload) {
        const uid = typeof payload.userId === 'string'
            ? new mongoose_2.Types.ObjectId(payload.userId)
            : payload.userId;
        const doc = await this.notificationModel.create({
            userId: uid,
            type: payload.type,
            title: payload.title,
            body: payload.body,
            metadata: payload.metadata,
        });
        void this.sendPush(uid.toString(), {
            title: payload.title,
            body: payload.body,
            data: {
                type: String(payload.type),
                notificationId: doc._id.toString(),
                ...(payload.metadata
                    ? Object.fromEntries(Object.entries(payload.metadata).map(([k, v]) => [
                        k,
                        typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
                            ? String(v)
                            : JSON.stringify(v),
                    ]))
                    : {}),
            },
        });
        return doc;
    }
    async sendPush(userId, params) {
        try {
            const tokens = await this.usersService.getFcmTokens(userId);
            if (!tokens.length)
                return;
            const { failedTokens } = await this.fcmService.sendToMultiple({
                tokens,
                title: params.title,
                body: params.body,
                data: params.data,
            });
            if (failedTokens.length) {
                await this.usersService.cleanInvalidFcmTokens(userId, failedTokens);
            }
        }
        catch (err) {
            this.logger.error(`Push notification failed for ${userId}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    async getNotifications(userId, query) {
        const filter = {
            userId: new mongoose_2.Types.ObjectId(userId),
        };
        if (query.isRead !== undefined) {
            filter.isRead = query.isRead;
        }
        if (query.type) {
            filter.type = query.type;
        }
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;
        const [data, total, unreadCount] = await Promise.all([
            this.notificationModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.notificationModel.countDocuments(filter).exec(),
            this.notificationModel.countDocuments({
                userId: new mongoose_2.Types.ObjectId(userId),
                isRead: false,
            }),
        ]);
        return { data, total, page, limit, unreadCount };
    }
    async markRead(userId, notificationId) {
        if (!mongoose_2.Types.ObjectId.isValid(notificationId)) {
            throw new common_1.NotFoundException('Notification not found');
        }
        const n = await this.notificationModel.findById(notificationId).exec();
        if (!n) {
            throw new common_1.NotFoundException('Notification not found');
        }
        if (n.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('You do not own this notification');
        }
        n.isRead = true;
        n.readAt = new Date();
        return n.save();
    }
    async markAllRead(userId) {
        const res = await this.notificationModel
            .updateMany({ userId: new mongoose_2.Types.ObjectId(userId), isRead: false }, { $set: { isRead: true, readAt: new Date() } })
            .exec();
        return {
            message: 'All notifications marked as read',
            updated: res.modifiedCount ?? 0,
        };
    }
    async deleteNotification(userId, notificationId) {
        if (!mongoose_2.Types.ObjectId.isValid(notificationId)) {
            throw new common_1.NotFoundException('Notification not found');
        }
        const n = await this.notificationModel.findById(notificationId).exec();
        if (!n) {
            throw new common_1.NotFoundException('Notification not found');
        }
        if (n.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('You do not own this notification');
        }
        await this.notificationModel.deleteOne({ _id: n._id }).exec();
        return { message: 'Notification deleted' };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        fcm_service_1.FcmService,
        users_service_1.UsersService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map