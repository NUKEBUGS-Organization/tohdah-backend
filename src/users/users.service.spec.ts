import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { User } from './schemas/user.schema';
import { Booking } from '../bookings/schemas/booking.schema';
import { Trip } from '../trips/schemas/trip.schema';
import {
  Request as RequestEntity,
} from '../requests/schemas/request.schema';
import { UserReport } from './schemas/user-report.schema';
import { UsersService } from './users.service';
import type { UserDocument } from './schemas/user.schema';
import { RedisService } from '../common/redis/redis.service';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: {
    findOne: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    updateOne: jest.Mock;
    create: jest.Mock;
  };
  let bookingModel: {
    countDocuments: jest.Mock;
    aggregate: jest.Mock;
  };
  let tripModel: { countDocuments: jest.Mock };
  let requestModel: { collection: { name: string }; countDocuments: jest.Mock };
  let userReportModel: { create: jest.Mock };
  let redisService: { deleteAllRefreshTokens: jest.Mock };

  const oid = new Types.ObjectId();
  const uid = oid.toString();
  const otherOid = new Types.ObjectId();

  const baseUserProps = (): Record<string, unknown> => ({
    _id: oid,
    fullName: 'Ada',
    email: 'ada@example.com',
    phoneNumber: '+1000',
    passwordHash: '$2b$stored',
    accountType: 'traveler',
    profilePhoto: null,
    bio: null,
    location: null,
    languages: ['en'],
    travelPreferences: ['carry_on'],
    isEmailVerified: true,
    isPhoneVerified: false,
    isIdVerified: false,
    isSelfieVerified: false,
    rating: 4.5,
    reviewCount: 2,
    onboardingCompleted: false,
    onboardingStep: 1,
    blockedUsers: [],
    get: jest.fn((k: string) =>
      k === 'createdAt' ? new Date('2025-01-01') : undefined,
    ),
  });

  beforeEach(async () => {
    userModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      updateOne: jest.fn(),
      create: jest.fn(),
    };
    bookingModel = {
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue([]),
    };
    tripModel = {
      countDocuments: jest.fn().mockResolvedValue(0),
    };
    requestModel = {
      collection: { name: 'requests' },
      countDocuments: jest.fn().mockResolvedValue(0),
    };
    userReportModel = { create: jest.fn().mockResolvedValue({}) };
    redisService = {
      deleteAllRefreshTokens: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Booking.name), useValue: bookingModel },
        { provide: getModelToken(Trip.name), useValue: tripModel },
        {
          provide: getModelToken(RequestEntity.name),
          useValue: requestModel,
        },
        {
          provide: getModelToken(UserReport.name),
          useValue: userReportModel,
        },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get(UsersService);
    jest.spyOn(service, 'comparePassword').mockResolvedValue(false);
    jest.spyOn(service, 'setPasswordFromPlain').mockResolvedValue(undefined);
  });

  describe('updateProfile', () => {
    it('returns updated profile', async () => {
      const user = {
        ...baseUserProps(),
        save: jest.fn().mockResolvedValue(undefined),
      };
      userModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(user as unknown as UserDocument),
      });

      const out = await service.updateProfile(uid, { bio: 'Hello' });

      expect(user.save).toHaveBeenCalled();
      expect(out.bio).toBe('Hello');
      expect(out.id).toBe(uid);
    });
  });

  describe('changePassword', () => {
    it('throws UnauthorizedException when current password wrong', async () => {
      const user = {
        ...baseUserProps(),
        passwordHash: 'hash',
        save: jest.fn(),
      };
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user as unknown as UserDocument),
      });
      jest.spyOn(service, 'comparePassword').mockResolvedValue(false);

      await expect(
        service.changePassword(uid, {
          currentPassword: 'bad',
          newPassword: 'newpass12',
          confirmNewPassword: 'newpass12',
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          message: 'Current password is incorrect',
        }),
      });
    });

    it('throws BadRequestException when confirmations differ', async () => {
      const user = {
        ...baseUserProps(),
        passwordHash: 'hash',
        save: jest.fn(),
      };
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user as unknown as UserDocument),
      });

      await expect(
        service.changePassword(uid, {
          currentPassword: 'ok',
          newPassword: 'newpass12',
          confirmNewPassword: 'different',
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          message: 'Passwords do not match',
        }),
      });
    });
  });

  describe('changeEmail', () => {
    it('throws ConflictException when email already taken', async () => {
      const user = {
        ...baseUserProps(),
        passwordHash: 'hash',
        email: 'x@x.com',
        save: jest.fn(),
      };
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user as unknown as UserDocument),
      });
      jest.spyOn(service, 'comparePassword').mockResolvedValue(true);
      userModel.findOne.mockResolvedValue({
        _id: otherOid,
      });

      await expect(
        service.changeEmail(uid, {
          newEmail: 'taken@x.com',
          password: 'secret',
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          message: 'Email already in use',
        }),
      });
    });
  });

  describe('blockUser', () => {
    it('throws BadRequestException when blocking self', async () => {
      await expect(service.blockUser(uid, uid)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('idempotent — does not save when target already blocked', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const actor = {
        ...baseUserProps(),
        _id: oid,
        blockedUsers: [otherOid],
        save,
      };
      const targetId = otherOid.toString();
      userModel.findById.mockImplementation((id: unknown) => {
        const s = String(id);
        if (s === uid) {
          return { exec: jest.fn().mockResolvedValue(actor) };
        }
        if (s === targetId) {
          return {
            exec: jest.fn().mockResolvedValue({ _id: otherOid, fullName: 'B' }),
          };
        }
        return { exec: jest.fn().mockResolvedValue(null) };
      });

      await service.blockUser(uid, targetId);
      await service.blockUser(uid, targetId);

      expect(save).not.toHaveBeenCalled();
    });
  });
});
