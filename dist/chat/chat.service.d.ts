import { Model, Types } from 'mongoose';
import { MessageDocument } from './schemas/message.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { BookingsService } from '../bookings/bookings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SendMessageDto } from './dto/send-message.dto';
export declare class ChatService {
    private readonly messageModel;
    private readonly bookingModel;
    private readonly bookingsService;
    private readonly notificationsService;
    constructor(messageModel: Model<MessageDocument>, bookingModel: Model<BookingDocument>, bookingsService: BookingsService, notificationsService: NotificationsService);
    private notifyAsync;
    private previewBody;
    sendMessage(userId: string, bookingId: string, dto: SendMessageDto): Promise<MessageDocument>;
    getMessages(userId: string, bookingId: string, page?: number, limit?: number): Promise<{
        data: MessageDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    getMyConversations(userId: string): Promise<{
        booking: (import("mongoose").Document<unknown, {}, Booking, {}, import("mongoose").DefaultSchemaOptions> & Booking & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: Types.ObjectId;
        }>) | null;
        bookingRef: string | undefined;
        lastMessage: {
            _id: Types.ObjectId;
            bookingId: unknown;
            senderId: unknown;
            receiverId: unknown;
            content: unknown;
            imageUrl: unknown;
            isRead: unknown;
            readAt: unknown;
            createdAt: unknown;
            updatedAt: unknown;
        };
        unreadCount: number;
    }[]>;
    markMessageRead(userId: string, messageId: string): Promise<MessageDocument>;
}
