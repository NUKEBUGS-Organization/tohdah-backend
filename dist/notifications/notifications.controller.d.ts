import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { NotificationsService } from './notifications.service';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    list(user: RequestUser, query: GetNotificationsQueryDto): Promise<{
        data: import("./schemas/notification.schema").NotificationDocument[];
        total: number;
        page: number;
        limit: number;
        unreadCount: number;
    }>;
    markAll(user: RequestUser): Promise<{
        message: string;
        updated: number;
    }>;
    markOne(user: RequestUser, id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/notification.schema").Notification, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/notification.schema").Notification & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    remove(user: RequestUser, id: string): Promise<{
        message: string;
    }>;
}
