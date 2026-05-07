import { Model, Types } from 'mongoose';
import { FcmService } from '../common/fcm/fcm.service';
import { UsersService } from '../users/users.service';
import { NotificationDocument, NotificationType } from './schemas/notification.schema';
export type CreateNotificationPayload = {
    userId: string | Types.ObjectId;
    type: NotificationType;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
};
export declare class NotificationsService {
    private readonly notificationModel;
    private readonly fcmService;
    private readonly usersService;
    private readonly logger;
    constructor(notificationModel: Model<NotificationDocument>, fcmService: FcmService, usersService: UsersService);
    createNotification(payload: CreateNotificationPayload): Promise<NotificationDocument>;
    private sendPush;
    getNotifications(userId: string, query: {
        isRead?: boolean;
        type?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: NotificationDocument[];
        total: number;
        page: number;
        limit: number;
        unreadCount: number;
    }>;
    markRead(userId: string, notificationId: string): Promise<NotificationDocument>;
    markAllRead(userId: string): Promise<{
        message: string;
        updated: number;
    }>;
    deleteNotification(userId: string, notificationId: string): Promise<{
        message: string;
    }>;
}
