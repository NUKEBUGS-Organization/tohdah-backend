import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Request as RequestEntity } from '../requests/schemas/request.schema';
import type { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { TrustService } from './trust.service';

function baseUser(over?: Partial<UserDocument>): UserDocument {
  return {
    rating: 0,
    reviewCount: 0,
    ...over,
  } as UserDocument;
}

describe('TrustService', () => {
  let service: TrustService;
  let usersService: jest.Mocked<
    Pick<UsersService, 'findById' | 'setVerificationFlag'>
  >;
  let bookingModel: jest.Mocked<
    Pick<Model<BookingDocument>, 'countDocuments' | 'aggregate'>
  >;
  let requestModel: {
    collection: { name: string };
  };

  beforeEach(async () => {
    usersService = {
      findById: jest.fn(),
      setVerificationFlag: jest.fn(),
    };
    bookingModel = {
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
    };
    requestModel = { collection: { name: 'requests' } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrustService,
        { provide: UsersService, useValue: usersService },
        { provide: getModelToken(Booking.name), useValue: bookingModel },
        { provide: getModelToken(RequestEntity.name), useValue: requestModel },
      ],
    }).compile();

    service = module.get(TrustService);
  });

  describe('calculateTrustScore', () => {
    it('all verifications true yields score >= 70', () => {
      const u = baseUser({
        isEmailVerified: true,
        isPhoneVerified: true,
        isIdVerified: true,
        isSelfieVerified: true,
        profilePhoto: ' https://x.com/a.png ',
        bio: 'hello',
      });
      const r = service.calculateTrustScore(u, 0, 0);
      expect(r.score).toBeGreaterThanOrEqual(70);
    });

    it('no verifications and empty profile yields 0 without activity', () => {
      const r = service.calculateTrustScore(baseUser(), 0, 0);
      expect(r.score).toBe(0);
    });

    it('partial verifications add partial score', () => {
      const u = baseUser({ isEmailVerified: true });
      const r = service.calculateTrustScore(u, 0, 0);
      expect(r.score).toBe(15);
      expect(r.breakdown.emailVerified.points).toBe(15);
    });
  });

  describe('getBadges', () => {
    beforeEach(() => {
      bookingModel.countDocuments.mockResolvedValue(0 as never);
      bookingModel.aggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      } as never);
    });

    it('top_rated when rating >= 4.5', async () => {
      usersService.findById.mockResolvedValue(
        baseUser({ rating: 4.9, reviewCount: 5 }),
      );

      const badges = await service.getBadges(new Types.ObjectId().toString());
      expect(badges.find((b) => b.badge === 'top_rated')?.earned).toBe(true);
    });

    it('community_champion when support deliveries >= 5', async () => {
      usersService.findById.mockResolvedValue(baseUser());
      bookingModel.aggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ n: 5 }]),
      } as never);

      const badges = await service.getBadges(new Types.ObjectId().toString());
      expect(
        badges.find((b) => b.badge === 'community_champion')?.earned,
      ).toBe(true);
    });
  });

  describe('verifyFieldStub', () => {
    it('sets field and returns trust payload', async () => {
      const uid = new Types.ObjectId().toString();
      usersService.setVerificationFlag.mockResolvedValue(
        baseUser({ isEmailVerified: true }) as never,
      );
      usersService.findById.mockResolvedValue(
        baseUser({ isEmailVerified: true }),
      );
      bookingModel.countDocuments.mockResolvedValue(0 as never);
      bookingModel.aggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      } as never);

      const res = await service.verifyFieldStub(uid, 'email');

      expect(usersService.setVerificationFlag).toHaveBeenCalledWith(uid, 'email');
      expect(res.score).toBeGreaterThanOrEqual(15);
    });
  });
});
