import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { BookingsService } from '../bookings/bookings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let messageModel: jest.Mocked<
    Pick<
      Model<MessageDocument>,
      | 'create'
      | 'updateMany'
      | 'aggregate'
      | 'find'
      | 'findById'
      | 'countDocuments'
    >
  >;
  let bookingModel: jest.Mocked<
    Pick<Model<BookingDocument>, 'find'>
  >;
  let bookingsService: jest.Mocked<Pick<BookingsService, 'findOneForParty'>>;
  let notificationsService: jest.Mocked<
    Pick<NotificationsService, 'createNotification'>
  >;

  const userOid = new Types.ObjectId();
  const otherOid = new Types.ObjectId();
  const bookingOid = new Types.ObjectId();

  const userId = userOid.toString();
  const bookingId = bookingOid.toString();

  const activeBooking = {
    _id: bookingOid,
    requesterId: userOid,
    travelerId: otherOid,
    status: 'confirmed',
    bookingRef: 'TDH-ABCDEF',
  } as BookingDocument;

  beforeEach(async () => {
    messageModel = {
      create: jest.fn(),
      updateMany: jest.fn(),
      aggregate: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn(),
    };
    bookingModel = { find: jest.fn() };
    bookingsService = {
      findOneForParty: jest.fn(),
    };
    notificationsService = {
      createNotification: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getModelToken(Message.name), useValue: messageModel },
        { provide: getModelToken(Booking.name), useValue: bookingModel },
        { provide: BookingsService, useValue: bookingsService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get(ChatService);
  });

  describe('sendMessage', () => {
    it('creates message and returns populated sender', async () => {
      bookingsService.findOneForParty.mockResolvedValue(activeBooking);

      const populatedDoc = {
        _id: new Types.ObjectId(),
        content: 'hello',
      };
      const createdStub = {
        populate: jest.fn().mockResolvedValue(populatedDoc),
      };
      messageModel.create.mockResolvedValue(createdStub as never);

      const res = await service.sendMessage(userId, bookingId, {
        content: 'hello',
      });

      expect(res).toBe(populatedDoc);
      expect(messageModel.create).toHaveBeenCalled();
      expect(notificationsService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'new_message',
          userId: otherOid.toString(),
        }),
      );
    });

    it('ForbiddenException when not a participant', async () => {
      bookingsService.findOneForParty.mockRejectedValue(
        new ForbiddenException('noop'),
      );

      await expect(
        service.sendMessage(userId, bookingId, { content: 'hi' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('BadRequestException on cancelled booking', async () => {
      bookingsService.findOneForParty.mockResolvedValue({
        ...activeBooking,
        status: 'cancelled',
      } as BookingDocument);

      await expect(
        service.sendMessage(userId, bookingId, { content: 'hi' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getMessages', () => {
    it('marks unread messages for receiver', async () => {
      bookingsService.findOneForParty.mockResolvedValue(activeBooking);

      const updateExec = jest.fn().mockResolvedValue(undefined);
      messageModel.updateMany.mockReturnValue({
        exec: updateExec,
      } as never);

      const exec = jest.fn().mockResolvedValue([]);
      messageModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({ exec }),
            }),
          }),
        }),
      } as never);
      messageModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      } as never);

      await service.getMessages(userId, bookingId);

      expect(updateExec).toHaveBeenCalled();
      expect(messageModel.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          receiverId: userOid,
          isRead: false,
        }),
        expect.any(Object),
      );
    });

    it('ForbiddenException for non-participant', async () => {
      bookingsService.findOneForParty.mockRejectedValue(
        new ForbiddenException('x'),
      );

      await expect(service.getMessages(userId, bookingId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
