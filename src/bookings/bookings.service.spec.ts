import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { Trip } from '../trips/schemas/trip.schema';
import { Request as RequestEntity } from '../requests/schemas/request.schema';
import { BookingsService } from './bookings.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('BookingsService', () => {
  let service: BookingsService;
  let bookingModel: jest.Mocked<
    Pick<
      Model<BookingDocument>,
      'create' | 'findOne' | 'exists' | 'findById' | 'find' | 'countDocuments'
    >
  >;
  let tripModel: jest.Mocked<
    Pick<Model<unknown>, 'findById' | 'findByIdAndUpdate' | 'updateOne'>
  >;
  let requestModel: jest.Mocked<
    Pick<Model<unknown>, 'findById' | 'findByIdAndUpdate'>
  >;

  const requesterOid = new Types.ObjectId();
  const travelerOid = new Types.ObjectId();
  const requestOid = new Types.ObjectId();
  const tripOid = new Types.ObjectId();
  const bookingOid = new Types.ObjectId();

  const requesterId = requesterOid.toString();
  const travelerId = travelerOid.toString();

  const mockTrip = () => ({
    _id: tripOid,
    travelerId: travelerOid,
    status: 'active',
    matchedRequestsCount: 1,
    save: jest.fn().mockResolvedValue(undefined),
  });

  beforeEach(async () => {
    bookingModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      exists: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };
    tripModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      updateOne: jest.fn(),
    };
    requestModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    const notificationsService = {
      createNotification: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getModelToken(Booking.name), useValue: bookingModel },
        { provide: getModelToken(Trip.name), useValue: tripModel },
        { provide: getModelToken(RequestEntity.name), useValue: requestModel },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    service = module.get(BookingsService);
  });

  describe('createMatch', () => {
    it('creates booking and updates request/trip when valid', async () => {
      const reqDoc = {
        _id: requestOid,
        requesterId: requesterOid,
        status: 'pending',
        currency: 'USD',
      };
      requestModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reqDoc),
      } as never);

      tripModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTrip()),
      } as never);

      bookingModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as never);

      bookingModel.exists.mockResolvedValue(null as never);

      const savedBooking = {
        _id: bookingOid,
        bookingRef: 'TDH-ABCDEF',
      };
      bookingModel.create.mockResolvedValue(savedBooking as never);

      requestModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(undefined),
      } as never);
      tripModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(undefined),
      } as never);

      await service.createMatch(requesterId, {
        requestId: requestOid.toString(),
        tripId: tripOid.toString(),
        offeredFee: 99,
      });

      expect(bookingModel.create).toHaveBeenCalled();
      expect(requestModel.findByIdAndUpdate).toHaveBeenCalledWith(
        requestOid,
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'matched',
            matchedTripId: tripOid,
            matchedTravelerId: travelerOid,
          }),
        }),
      );
      expect(tripModel.findByIdAndUpdate).toHaveBeenCalledWith(
        tripOid,
        { $inc: { matchedRequestsCount: 1 } },
      );
    });

    it('throws ForbiddenException when request not owned by user', async () => {
      requestModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: requestOid,
          requesterId: travelerOid,
          status: 'pending',
        }),
      } as never);

      await expect(
        service.createMatch(requesterId, {
          requestId: requestOid.toString(),
          tripId: tripOid.toString(),
          offeredFee: 10,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(bookingModel.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when request not pending', async () => {
      requestModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: requestOid,
          requesterId: requesterOid,
          status: 'matched',
        }),
      } as never);

      await expect(
        service.createMatch(requesterId, {
          requestId: requestOid.toString(),
          tripId: tripOid.toString(),
          offeredFee: 10,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when trip not active', async () => {
      requestModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: requestOid,
          requesterId: requesterOid,
          status: 'pending',
        }),
      } as never);

      tripModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: tripOid,
          travelerId: travelerOid,
          status: 'cancelled',
        }),
      } as never);

      await expect(
        service.createMatch(requesterId, {
          requestId: requestOid.toString(),
          tripId: tripOid.toString(),
          offeredFee: 10,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('acceptBooking', () => {
    it('throws ForbiddenException for non-traveler', async () => {
      bookingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: bookingOid,
          travelerId: travelerOid,
          requesterId: requesterOid,
          status: 'pending_acceptance',
          offeredFee: 40,
          platformCommissionPct: 10,
          save: jest.fn(),
        }),
      } as never);

      await expect(
        service.acceptBooking(requesterId, bookingOid.toString()),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws BadRequestException when booking not acceptable', async () => {
      bookingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: bookingOid,
          travelerId: travelerOid,
          requesterId: requesterOid,
          status: 'paid',
          offeredFee: 40,
          save: jest.fn(),
        }),
      } as never);

      await expect(
        service.acceptBooking(travelerId, bookingOid.toString()),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('counterOffer', () => {
    it('sets countered status and counterFee', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const booking = {
        _id: bookingOid,
        travelerId: travelerOid,
        status: 'pending_acceptance',
        counterFee: undefined,
        save,
      };
      bookingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(booking),
      } as never);

      await service.counterOffer(travelerId, bookingOid.toString(), {
        counterFee: 55,
      });

      expect(booking.counterFee).toBe(55);
      expect(booking.status).toBe('countered');
      expect(save).toHaveBeenCalled();
    });
  });

  describe('declineBooking', () => {
    it('reverts linked request to pending', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const booking = {
        _id: bookingOid,
        travelerId: travelerOid,
        requestId: requestOid,
        tripId: tripOid,
        status: 'pending_acceptance',
        save,
      };
      bookingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(booking),
      } as never);

      const tripSave = jest.fn().mockResolvedValue(undefined);
      tripModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          matchedRequestsCount: 2,
          save: tripSave,
        }),
      } as never);

      requestModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(undefined),
      } as never);

      await service.declineBooking(travelerId, bookingOid.toString());

      expect(requestModel.findByIdAndUpdate).toHaveBeenCalledWith(
        requestOid,
        expect.objectContaining({
          $set: { status: 'pending' },
          $unset: { matchedTripId: 1, matchedTravelerId: 1 },
        }),
      );
      expect(save).toHaveBeenCalled();
    });
  });

  describe('submitProofOfDelivery', () => {
    it('throws BadRequestException on wrong confirmation code', async () => {
      bookingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: bookingOid,
          travelerId: travelerOid,
          status: 'in_transit',
          podConfirmationCode: '111111',
          save: jest.fn(),
        }),
      } as never);

      let err: unknown;
      await service
        .submitProofOfDelivery(travelerId, bookingOid.toString(), {
          podPhotoUrl: 'https://x.test/p.jpg',
          podConfirmationCode: '000000',
        })
        .catch((e) => {
          err = e;
        });
      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).message).toBe('Invalid confirmation code');
    });
  });

  describe('completeBooking', () => {
    it('throws ForbiddenException for non-requester', async () => {
      bookingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: bookingOid,
          travelerId: travelerOid,
          requesterId: requesterOid,
          tripId: tripOid,
          status: 'delivered',
          save: jest.fn(),
        }),
      } as never);

      await expect(
        service.completeBooking(travelerId, bookingOid.toString()),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
