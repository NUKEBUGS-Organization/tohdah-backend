import { ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { FcmService } from '../common/fcm/fcm.service';
import { UsersService } from '../users/users.service';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { NotificationsService } from './notifications.service';

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationModel: jest.Mocked<
    Pick<
      Model<NotificationDocument>,
      'create' | 'find' | 'findById' | 'countDocuments' | 'updateMany' | 'deleteOne'
    >
  >;
  let fcmService: { sendToMultiple: jest.Mock };
  let usersService: {
    getFcmTokens: jest.Mock;
    cleanInvalidFcmTokens: jest.Mock;
  };

  const uid = new Types.ObjectId();

  beforeEach(async () => {
    notificationModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn(),
      updateMany: jest.fn(),
      deleteOne: jest.fn(),
    };

    fcmService = {
      sendToMultiple: jest
        .fn()
        .mockResolvedValue({ successCount: 0, failedTokens: [] }),
    };
    usersService = {
      getFcmTokens: jest.fn().mockResolvedValue([]),
      cleanInvalidFcmTokens: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken(Notification.name),
          useValue: notificationModel,
        },
        { provide: FcmService, useValue: fcmService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  it('createNotification saves fields correctly', async () => {
    const saved = {
      _id: new Types.ObjectId(),
      userId: uid,
      type: 'otp_verified',
      title: 'T',
      body: 'B',
      metadata: { x: 1 },
    };
    notificationModel.create.mockResolvedValue(saved as never);

    const res = await service.createNotification({
      userId: uid.toString(),
      type: 'otp_verified',
      title: 'T',
      body: 'B',
      metadata: { x: 1 },
    });

    expect(res).toBe(saved);
    expect(notificationModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'otp_verified',
        title: 'T',
        body: 'B',
        metadata: { x: 1 },
      }),
    );
  });

  it('createNotification triggers sendPush (non-blocking)', async () => {
    const saved = {
      _id: new Types.ObjectId(),
      userId: uid,
      type: 'otp_verified',
      title: 'T',
      body: 'B',
    };
    notificationModel.create.mockResolvedValue(saved as never);
    usersService.getFcmTokens.mockResolvedValue(['device-a']);

    await service.createNotification({
      userId: uid.toString(),
      type: 'otp_verified',
      title: 'T',
      body: 'B',
    });

    await flushMicrotasks();

    expect(usersService.getFcmTokens).toHaveBeenCalledWith(uid.toString());
    expect(fcmService.sendToMultiple).toHaveBeenCalledWith(
      expect.objectContaining({
        tokens: ['device-a'],
        title: 'T',
        body: 'B',
        data: expect.objectContaining({
          type: 'otp_verified',
          notificationId: saved._id.toString(),
        }),
      }),
    );
  });

  it('createNotification cleans invalid FCM tokens after failed send', async () => {
    const saved = {
      _id: new Types.ObjectId(),
      userId: uid,
      type: 'booking_update',
      title: 'T',
      body: 'B',
    };
    notificationModel.create.mockResolvedValue(saved as never);
    usersService.getFcmTokens.mockResolvedValue(['bad', 'good']);
    fcmService.sendToMultiple.mockResolvedValue({
      successCount: 1,
      failedTokens: ['bad'],
    });

    await service.createNotification({
      userId: uid.toString(),
      type: 'booking_update',
      title: 'T',
      body: 'B',
    });

    await flushMicrotasks();

    expect(usersService.cleanInvalidFcmTokens).toHaveBeenCalledWith(uid.toString(), ['bad']);
  });

  it('getNotifications filters by current user', async () => {
    const exec = jest.fn().mockResolvedValue([]);
    notificationModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({ exec }),
        }),
      }),
    } as never);
    notificationModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    } as never);

    await service.getNotifications(uid.toString(), {});

    expect(notificationModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: expect.any(Types.ObjectId),
      }),
    );
  });

  it('markAllRead returns updated count', async () => {
    notificationModel.updateMany.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ modifiedCount: 3 }),
    } as never);

    const res = await service.markAllRead(uid.toString());

    expect(res.updated).toBe(3);
    expect(res.message).toBe('All notifications marked as read');
  });

  it('deleteNotification throws ForbiddenException for non-owner', async () => {
    const nid = new Types.ObjectId().toString();
    const otherUser = new Types.ObjectId();

    notificationModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: nid,
        userId: otherUser,
      }),
    } as never);

    await expect(service.deleteNotification(uid.toString(), nid)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
