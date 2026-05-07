import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Review, ReviewDocument } from './schemas/review.schema';
import { BookingsService } from '../bookings/bookings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewModel: jest.Mocked<
    Pick<
      Model<ReviewDocument>,
      'create' | 'exists' | 'aggregate' | 'find' | 'countDocuments'
    >
  >;
  let bookingsService: jest.Mocked<
    Pick<BookingsService, 'findOneForParty'>
  >;
  let usersService: jest.Mocked<
    Pick<UsersService, 'updateRatingSummary'>
  >;
  let notificationsService: jest.Mocked<
    Pick<NotificationsService, 'createNotification'>
  >;

  const reviewerOid = new Types.ObjectId();
  const revieweeOid = new Types.ObjectId();
  const bookingOid = new Types.ObjectId();

  const reviewerId = reviewerOid.toString();
  const revieweeId = revieweeOid.toString();
  const bookingId = bookingOid.toString();

  const completedBooking = {
    _id: bookingOid,
    requesterId: reviewerOid,
    travelerId: revieweeOid,
    status: 'completed',
  } as BookingDocument;

  beforeEach(async () => {
    reviewModel = {
      create: jest.fn(),
      exists: jest.fn(),
      aggregate: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };
    bookingsService = { findOneForParty: jest.fn() };
    usersService = { updateRatingSummary: jest.fn().mockResolvedValue(undefined) };
    notificationsService = {
      createNotification: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getModelToken(Review.name), useValue: reviewModel },
        { provide: BookingsService, useValue: bookingsService },
        { provide: UsersService, useValue: usersService },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    service = module.get(ReviewsService);
  });

  describe('createReview', () => {
    beforeEach(() => {
      reviewModel.exists.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as never);
      reviewModel.aggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ avg: 5, count: 1 }]),
      } as never);
    });

    it('creates review and updates reviewee rating', async () => {
      bookingsService.findOneForParty.mockResolvedValue(completedBooking);
      const reviewObjId = new Types.ObjectId();
      const populated = { _id: reviewObjId };
      const createdStub = {
        _id: reviewObjId,
        populate: jest.fn().mockResolvedValue(populated),
      };
      reviewModel.create.mockResolvedValue(createdStub as never);

      const res = await service.create(reviewerId, {
        bookingId,
        revieweeId,
        overallRating: 5,
      });

      expect(res).toBe(populated);
      expect(reviewModel.create).toHaveBeenCalled();
      expect(usersService.updateRatingSummary).toHaveBeenCalledWith(
        revieweeId,
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('BadRequestException when booking not completed', async () => {
      bookingsService.findOneForParty.mockResolvedValue({
        ...completedBooking,
        status: 'paid',
      } as BookingDocument);

      await expect(
        service.create(reviewerId, {
          bookingId,
          revieweeId,
          overallRating: 4,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('Forbidden when not participant', async () => {
      bookingsService.findOneForParty.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(
        service.create(reviewerId, {
          bookingId,
          revieweeId: new Types.ObjectId().toString(),
          overallRating: 4,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('BadRequestException for invalid reviewee', async () => {
      bookingsService.findOneForParty.mockResolvedValue(completedBooking);

      await expect(
        service.create(reviewerId, {
          bookingId,
          revieweeId: new Types.ObjectId().toString(),
          overallRating: 4,
        }),
      ).rejects.toThrow('Invalid reviewee');
    });

    it('ConflictException when duplicate review', async () => {
      bookingsService.findOneForParty.mockResolvedValue(completedBooking);
      reviewModel.exists.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'x' }),
      } as never);

      await expect(
        service.create(reviewerId, {
          bookingId,
          revieweeId,
          overallRating: 4,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('propagates NotFound for missing booking', async () => {
      bookingsService.findOneForParty.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(
        service.create(reviewerId, {
          bookingId,
          revieweeId,
          overallRating: 4,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getReviewsForUser', () => {
    it('returns visible reviews only and averageRating', async () => {
      const exec = jest.fn().mockResolvedValue([]);
      reviewModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({ exec }),
            }),
          }),
        }),
      } as never);
      reviewModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(2),
      } as never);

      reviewModel.aggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ avg: 4.5 }]),
      } as never);

      const res = await service.getReviewsForUser(revieweeId, 1, 10);

      expect(res.averageRating).toBe(4.5);
      expect(reviewModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ isVisible: true }),
      );
    });
  });
});
