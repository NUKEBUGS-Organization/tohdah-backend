import { NOTIFICATION_TYPES } from '../schemas/notification.schema';
export declare class GetNotificationsQueryDto {
    isRead?: boolean;
    type?: (typeof NOTIFICATION_TYPES)[number];
    page?: number;
    limit?: number;
}
