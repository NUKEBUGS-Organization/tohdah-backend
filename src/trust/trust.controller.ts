import { Controller, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { TrustService } from './trust.service';
import { VerifyFieldDto } from './dto/verify-field.dto';

@Controller('trust')
@UseGuards(JwtAuthGuard)
export class TrustController {
  constructor(private readonly trustService: TrustService) {}

  @Get('me')
  getMine(@CurrentUser() user: RequestUser) {
    return this.trustService.getTrustResult(user.userId);
  }

  @Get('user/:userId')
  getUser(@Param('userId') userId: string) {
    return this.trustService.getTrustResult(userId);
  }

  @Get('badges/:userId')
  badges(@Param('userId') userId: string) {
    return this.trustService.getBadges(userId);
  }

  /**
   * Stub only — see TrustService.verifyFieldStub. Replace with webhook-driven
   * verification in production.
   */
  @Patch('verify')
  verifyStub(@CurrentUser() user: RequestUser, @Body() dto: VerifyFieldDto) {
    return this.trustService.verifyFieldStub(user.userId, dto.field);
  }
}
