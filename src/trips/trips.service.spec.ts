import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { Trip, TripDocument } from './schemas/trip.schema';
import { TripsService } from './trips.service';

describe('TripsService', () => {
  let service: TripsService;
  let model: jest.Mocked<Pick<Model<TripDocument>, 'create' | 'find' | 'findById' | 'countDocuments'>>;

  const ownerId = new Types.ObjectId().toString();
  const otherId = new Types.ObjectId().toString();
  const tripId = new Types.ObjectId().toString();

  const baseCreateDto = {
    origin: 'NYC',
    destination: 'LON',
    departureDate: '2030-06-01T10:00:00.000Z',
    arrivalDate: '2030-06-02T10:00:00.000Z',
    luggageSpace: 'medium' as const,
    pricingType: 'fixed' as const,
    pricePerKg: 12,
  };

  beforeEach(async () => {
    model = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        {
          provide: getModelToken(Trip.name),
          useValue: model,
        },
      ],
    }).compile();

    service = module.get(TripsService);
  });

  describe('create', () => {
    it('creates trip on success', async () => {
      const saved = {
        _id: tripId,
        travelerId: new Types.ObjectId(ownerId),
        ...baseCreateDto,
        departureDate: new Date(baseCreateDto.departureDate),
        arrivalDate: new Date(baseCreateDto.arrivalDate),
      } as TripDocument;
      model.create.mockResolvedValue(saved as never);

      const result = await service.create(ownerId, {
        ...baseCreateDto,
        acceptedCategories: ['documents'],
        openToCommunitySupport: true,
      });

      expect(result).toBe(saved);
      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({
          travelerId: new Types.ObjectId(ownerId),
          origin: 'NYC',
          destination: 'LON',
          luggageSpace: 'medium',
          acceptedCategories: ['documents'],
          openToCommunitySupport: true,
          willingToAssistElderly: false,
          status: 'active',
          matchedRequestsCount: 0,
        }),
      );
    });

    it('throws when arrivalDate is before departureDate', async () => {
      await expect(
        service.create(ownerId, {
          ...baseCreateDto,
          departureDate: '2030-06-10T10:00:00.000Z',
          arrivalDate: '2030-06-05T10:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(model.create).not.toHaveBeenCalled();
    });

    it('throws when pricing fixed without pricePerKg', async () => {
      await expect(
        service.create(ownerId, {
          ...baseCreateDto,
          pricingType: 'fixed',
          pricePerKg: undefined,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(model.create).not.toHaveBeenCalled();
    });
  });

  describe('getMyTrips', () => {
    it('queries only current traveler trips', async () => {
      const exec = jest.fn().mockResolvedValue([]);
      const sort = jest.fn().mockReturnValue({ exec });
      model.find.mockReturnValue({ sort } as never);

      await service.getMyTrips(ownerId, undefined);

      expect(model.find).toHaveBeenCalledWith({
        travelerId: new Types.ObjectId(ownerId),
      });
      expect(sort).toHaveBeenCalledWith({ departureDate: -1 });
    });

    it('applies status filter when provided', async () => {
      const exec = jest.fn().mockResolvedValue([]);
      const sort = jest.fn().mockReturnValue({ exec });
      model.find.mockReturnValue({ sort } as never);

      await service.getMyTrips(ownerId, 'active');

      expect(model.find).toHaveBeenCalledWith({
        travelerId: new Types.ObjectId(ownerId),
        status: 'active',
      });
    });
  });

  describe('cancelTrip', () => {
    it('throws ForbiddenException for non-owner', async () => {
      const trip = {
        travelerId: new Types.ObjectId(ownerId),
        status: 'active',
        save: jest.fn(),
      } as unknown as TripDocument;
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(trip),
      } as never);

      await expect(service.cancelTrip(otherId, tripId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(trip.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when already cancelled', async () => {
      const trip = {
        travelerId: new Types.ObjectId(ownerId),
        status: 'cancelled',
        save: jest.fn(),
      } as unknown as TripDocument;
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(trip),
      } as never);

      await expect(service.cancelTrip(ownerId, tripId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(trip.save).not.toHaveBeenCalled();
    });

    it('cancels for owner when active', async () => {
      const trip = {
        travelerId: new Types.ObjectId(ownerId),
        status: 'active',
        save: jest.fn().mockResolvedValue(undefined),
      } as unknown as TripDocument;
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(trip),
      } as never);

      const res = await service.cancelTrip(ownerId, tripId);

      expect(res).toEqual({ message: 'Trip cancelled' });
      expect(trip.status).toBe('cancelled');
      expect(trip.save).toHaveBeenCalled();
    });
  });
});
