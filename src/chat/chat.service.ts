import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { BookingsService } from '../bookings/bookings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SendMessageDto } from './dto/send-message.dto';

const SENDER_POPULATE = [
  {
    path: 'senderId',
    select: 'fullName profilePhoto',
  },
] as const;

const BOOKING_SUMMARY_POPULATE = [
  { path: 'requesterId', select: 'fullName profilePhoto' },
  { path: 'travelerId', select: 'fullName profilePhoto' },
] as const;

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    private readonly bookingsService: BookingsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private notifyAsync(p: Promise<unknown>): void {
    void p.catch(() => undefined);
  }

  private previewBody(content: string): string {
    if (content.length <= 80) return content;
    return `${content.slice(0, 80)}...`;
  }

  async sendMessage(
    userId: string,
    bookingId: string,
    dto: SendMessageDto,
  ): Promise<MessageDocument> {
    const booking = await this.bookingsService.findOneForParty(bookingId, userId);
    if (booking.status === 'cancelled') {
      throw new BadRequestException('Cannot message on a cancelled booking');
    }

    const receiverId =
      userId === booking.requesterId.toString()
        ? (booking.travelerId as Types.ObjectId)
        : (booking.requesterId as Types.ObjectId);

    const msg = await this.messageModel.create({
      bookingId: new Types.ObjectId(bookingId),
      senderId: new Types.ObjectId(userId),
      receiverId,
      content: dto.content.trim(),
      imageUrl: dto.imageUrl?.trim(),
    });

    const populated = await msg.populate([...SENDER_POPULATE]);

    this.notifyAsync(
      this.notificationsService.createNotification({
        userId: receiverId.toString(),
        type: 'new_message',
        title: 'New message',
        body: this.previewBody(dto.content.trim()),
        metadata: {
          bookingId,
          messageId: populated._id.toString(),
        },
      }),
    );

    return populated;
  }

  async getMessages(
    userId: string,
    bookingId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: MessageDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    await this.bookingsService.findOneForParty(bookingId, userId);

    const oid = new Types.ObjectId(bookingId);
    const uid = new Types.ObjectId(userId);
    await this.messageModel
      .updateMany(
        { bookingId: oid, receiverId: uid, isRead: false },
        { $set: { isRead: true, readAt: new Date() } },
      )
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

  async getMyConversations(userId: string) {
    const userOid = new Types.ObjectId(userId);

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

    const bookingIds = grouped.map((g) => g._id as Types.ObjectId);

    const unreadAgg = await this.messageModel
      .aggregate<{ _id: Types.ObjectId; unreadCount: number }>([
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

    const unreadMap = new Map(
      unreadAgg.map((row) => [row._id.toString(), row.unreadCount]),
    );

    const bookings = await this.bookingModel
      .find({ _id: { $in: bookingIds } })
      .populate([...BOOKING_SUMMARY_POPULATE])
      .lean()
      .exec();

    const bookingById = new Map(bookings.map((b) => [b._id.toString(), b]));

    return grouped.map((g) => {
      const bid = (g._id as Types.ObjectId).toString();
      const lm = g.lastMessage as Record<string, unknown> & {
        _id: Types.ObjectId;
      };
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

  async markMessageRead(
    userId: string,
    messageId: string,
  ): Promise<MessageDocument> {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new NotFoundException('Message not found');
    }
    const msg = await this.messageModel.findById(messageId).exec();
    if (!msg) {
      throw new NotFoundException('Message not found');
    }
    if (msg.receiverId.toString() !== userId) {
      throw new ForbiddenException('Only the receiver can mark this message read');
    }
    msg.isRead = true;
    msg.readAt = new Date();
    return msg.save();
  }
}
