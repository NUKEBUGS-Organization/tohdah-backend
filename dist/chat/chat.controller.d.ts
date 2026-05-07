import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getMy(user: RequestUser): Promise<{
        booking: (import("mongoose").Document<unknown, {}, import("../bookings/schemas/booking.schema").Booking, {}, import("mongoose").DefaultSchemaOptions> & import("../bookings/schemas/booking.schema").Booking & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>) | null;
        bookingRef: string | undefined;
        lastMessage: {
            _id: import("mongoose").Types.ObjectId;
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
    getMessages(user: RequestUser, bookingId: string, query: GetMessagesQueryDto): Promise<{
        data: import("./schemas/message.schema").MessageDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    send(user: RequestUser, bookingId: string, dto: SendMessageDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/message.schema").Message, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/message.schema").Message & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    markRead(user: RequestUser, messageId: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/message.schema").Message, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/message.schema").Message & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
}
