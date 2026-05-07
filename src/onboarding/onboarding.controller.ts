import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { OnboardingService } from './onboarding.service';
import { OnboardingStepDto } from './dto/onboarding-step.dto';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('step')
  completeStep(
    @CurrentUser() user: RequestUser,
    @Body() dto: OnboardingStepDto,
  ) {
    return this.onboardingService.completeStep(user.userId, dto);
  }

  @Get('status')
  status(@CurrentUser() user: RequestUser) {
    return this.onboardingService.getStatus(user.userId);
  }
}
