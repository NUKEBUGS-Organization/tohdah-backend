import { BadRequestException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { UsersService } from '../users/users.service';
import type { MeProfileResponse } from '../users/users.service';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let usersService: {
    requireUser: jest.Mock;
    serializeMe: jest.Mock;
  };
  const uid = 'user-id-1';

  const baseMe = (u: {
    onboardingStep: number;
    onboardingCompleted: boolean;
    accountType?: string;
  }): MeProfileResponse => ({
    id: uid,
    fullName: 'X',
    email: 'x@x.com',
    phoneNumber: '+1',
    accountType: (u.accountType as MeProfileResponse['accountType']) ?? null,
    profilePhoto: null,
    bio: null,
    location: null,
    languages: [],
    travelPreferences: [],
    isEmailVerified: false,
    isPhoneVerified: false,
    isIdVerified: false,
    isSelfieVerified: false,
    rating: 0,
    reviewCount: 0,
    onboardingCompleted: u.onboardingCompleted,
    onboardingStep: u.onboardingStep,
    createdAt: undefined,
  });

  const makeUser = (p: {
    onboardingStep: number;
    onboardingCompleted?: boolean;
    accountType?: string;
    fullName?: string;
  }) => ({
    onboardingStep: p.onboardingStep,
    onboardingCompleted: p.onboardingCompleted ?? false,
    accountType: p.accountType,
    fullName: p.fullName ?? 'X',
    bio: undefined,
    profilePhoto: undefined,
    location: undefined,
    languages: undefined,
    travelPreferences: undefined,
    save: jest.fn().mockResolvedValue(undefined),
  });

  beforeEach(() => {
    usersService = {
      requireUser: jest.fn(),
      serializeMe: jest.fn((u: ReturnType<typeof makeUser>) =>
        baseMe({
          onboardingStep: u.onboardingStep,
          onboardingCompleted: u.onboardingCompleted,
          accountType: u.accountType,
        }),
      ),
    };
    service = new OnboardingService(usersService as unknown as UsersService);
  });

  describe('completeStep', () => {
    it('step 1 advances onboardingStep to 1', async () => {
      const user = makeUser({ onboardingStep: 0 });
      usersService.requireUser.mockResolvedValue(user);

      await service.completeStep(uid, { step: 1 });

      expect(user.onboardingStep).toBe(1);
      expect(user.save).toHaveBeenCalled();
      expect(usersService.serializeMe).toHaveBeenCalledWith(user);
    });

    it('throws when skipping a step', async () => {
      const user = makeUser({ onboardingStep: 0 });
      usersService.requireUser.mockResolvedValue(user);

      await expect(
        service.completeStep(uid, { step: 2 }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.completeStep(uid, { step: 2 }),
      ).rejects.toThrow('Complete previous steps first');
    });

    it('throws when onboarding already completed', async () => {
      const user = makeUser({ onboardingStep: 4, onboardingCompleted: true });
      usersService.requireUser.mockResolvedValue(user);

      await expect(
        service.completeStep(uid, { step: 1 }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.completeStep(uid, { step: 1 }),
      ).rejects.toThrow('Onboarding already completed');
    });

    it('step 3 sets accountType', async () => {
      const user = makeUser({ onboardingStep: 2 });
      usersService.requireUser.mockResolvedValue(user);

      await service.completeStep(uid, { step: 3, accountType: 'requester' });

      expect(user.accountType).toBe('requester');
      expect(user.onboardingStep).toBe(3);
    });

    it('step 4 sets onboardingCompleted true', async () => {
      const user = makeUser({ onboardingStep: 3 });
      usersService.requireUser.mockResolvedValue(user);

      await service.completeStep(uid, {
        step: 4,
        fullName: 'Ada Lovelace',
        bio: 'Hi',
      });

      expect(user.onboardingCompleted).toBe(true);
      expect(user.onboardingStep).toBe(4);
      expect(user.fullName).toBe('Ada Lovelace');
    });
  });

  describe('getStatus', () => {
    it('returns nextStep when incomplete', async () => {
      usersService.requireUser.mockResolvedValue(
        makeUser({ onboardingStep: 2, accountType: 'traveler' }),
      );

      await expect(service.getStatus(uid)).resolves.toEqual({
        onboardingCompleted: false,
        onboardingStep: 2,
        nextStep: 3,
        accountType: 'traveler',
      });
    });

    it('returns nextStep null when onboarding completed', async () => {
      usersService.requireUser.mockResolvedValue(
        makeUser({
          onboardingStep: 4,
          onboardingCompleted: true,
          accountType: 'both',
        }),
      );

      await expect(service.getStatus(uid)).resolves.toEqual({
        onboardingCompleted: true,
        onboardingStep: 4,
        nextStep: null,
        accountType: 'both',
      });
    });
  });
});
