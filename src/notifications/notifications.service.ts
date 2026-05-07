import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FcmService } from '../common/fcm/fcm.service';
import { UsersService } from '../users/users.service';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';

export type CreateNotificationPayload = {
  userId: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly fcmService: FcmService,
    private readonly usersService: UsersService,
  ) {}

  async createNotification(
    payload: CreateNotificationPayload,
  ): Promise<NotificationDocument> {
    const uid =
      typeof payload.userId === 'string'
        ? new Types.ObjectId(payload.userId)
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
          ? Object.fromEntries(
              Object.entries(payload.metadata).map(([k, v]) => [
                k,
                typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
                  ? String(v)
                  : JSON.stringify(v),
              ]),
            )
          : {}),
      },
    });

    return doc;
  }

  private async sendPush(
    userId: string,
    params: { title: string; body: string; data?: Record<string, string> },
  ): Promise<void> {
    try {
      const tokens = await this.usersService.getFcmTokens(userId);
      if (!tokens.length) return;

      const { failedTokens } = await this.fcmService.sendToMultiple({
        tokens,
        title: params.title,
        body: params.body,
        data: params.data,
      });

      if (failedTokens.length) {
        await this.usersService.cleanInvalidFcmTokens(userId, failedTokens);
      }
    } catch (err) {
      this.logger.error(
        `Push notification failed for ${userId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async getNotifications(
    userId: string,
    query: {
      isRead?: boolean;
      type?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{
    data: NotificationDocument[];
    total: number;
    page: number;
    limit: number;
    unreadCount: number;
  }> {
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
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
        userId: new Types.ObjectId(userId),
        isRead: false,
      }),
    ]);

    return { data, total, page, limit, unreadCount };
  }

  async markRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationDocument> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new NotFoundException('Notification not found');
    }
    const n = await this.notificationModel.findById(notificationId).exec();
    if (!n) {
      throw new NotFoundException('Notification not found');
    }
    if (n.userId.toString() !== userId) {
      throw new ForbiddenException('You do not own this notification');
    }
    n.isRead = true;
    n.readAt = new Date();
    return n.save();
  }

  async markAllRead(userId: string): Promise<{ message: string; updated: number }> {
    const res = await this.notificationModel
      .updateMany(
        { userId: new Types.ObjectId(userId), isRead: false },
        { $set: { isRead: true, readAt: new Date() } },
      )
      .exec();
    return {
      message: 'All notifications marked as read',
      updated: res.modifiedCount ?? 0,
    };
  }

  async deleteNotification(
    userId: string,
    notificationId: string,
  ): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new NotFoundException('Notification not found');
    }
    const n = await this.notificationModel.findById(notificationId).exec();
    if (!n) {
      throw new NotFoundException('Notification not found');
    }
    if (n.userId.toString() !== userId) {
      throw new ForbiddenException('You do not own this notification');
    }
    await this.notificationModel.deleteOne({ _id: n._id }).exec();
    return { message: 'Notification deleted' };
  }
}
