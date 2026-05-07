import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import type { OnboardingStepDto } from './dto/onboarding-step.dto';
import type { MeProfileResponse } from '../users/users.service';

@Injectable()
export class OnboardingService {
  constructor(private readonly usersService: UsersService) {}

  async completeStep(userId: string, dto: OnboardingStepDto): Promise<{
    message: string;
    user: MeProfileResponse;
    onboardingCompleted: boolean;
  }> {
    const user = await this.usersService.requireUser(userId);

    if (user.onboardingCompleted) {
      throw new BadRequestException('Onboarding already completed');
    }

    const stepNext = Number(user.onboardingStep ?? 0) + 1;
    if (dto.step !== stepNext) {
      throw new BadRequestException('Complete previous steps first');
    }

    if (dto.step === 3 && !dto.accountType) {
      throw new BadRequestException('accountType is required for step 3');
    }

    switch (dto.step) {
      case 1:
        user.onboardingStep = 1;
        break;
      case 2:
        user.onboardingStep = 2;
        break;
      case 3:
        user.accountType = dto.accountType!;
        user.onboardingStep = 3;
        break;
      case 4:
        if (dto.fullName !== undefined)
          user.fullName = dto.fullName.trim();
        if (dto.profilePhoto !== undefined) {
          user.profilePhoto = dto.profilePhoto?.trim();
        }
        if (dto.bio !== undefined) user.bio = dto.bio?.trim();
        if (dto.location !== undefined) user.location = dto.location?.trim();
        if (dto.languages !== undefined) user.languages = dto.languages;
        if (dto.travelPreferences !== undefined) {
          user.travelPreferences = dto.travelPreferences;
        }
        user.onboardingStep = 4;
        user.onboardingCompleted = true;
        break;
      default:
        throw new BadRequestException('Complete previous steps first');
    }

    await user.save();

    const profile = this.usersService.serializeMe(user);
    return {
      message: 'Step completed',
      user: profile,
      onboardingCompleted: !!profile.onboardingCompleted,
    };
  }

  async getStatus(userId: string): Promise<{
    onboardingCompleted: boolean;
    onboardingStep: number;
    nextStep: number | null;
    accountType: string | null;
  }> {
    const user = await this.usersService.requireUser(userId);

    const step = Number(user.onboardingStep ?? 0);

    let nextStep: number | null = null;
    if (!user.onboardingCompleted) {
      nextStep = Math.min(step + 1, 4);
    }

    return {
      onboardingCompleted: !!user.onboardingCompleted,
      onboardingStep: step,
      nextStep,
      accountType: user.accountType ?? null,
    };
  }
}
