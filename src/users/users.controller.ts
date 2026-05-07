import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePhoneDto } from './dto/change-phone.dto';
import { ReportUserDto } from './dto/report-user.dto';
import { RegisterFcmTokenDto } from './dto/register-fcm-token.dto';
import { RedisService } from '../common/redis/redis.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {}

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @Patch('change-password')
  changePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.userId, dto);
  }

  @Patch('change-email')
  changeEmail(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangeEmailDto,
  ) {
    return this.usersService.changeEmail(user.userId, dto);
  }

  @Patch('change-phone')
  changePhone(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangePhoneDto,
  ) {
    return this.usersService.changePhone(user.userId, dto);
  }

  @Get('blocked')
  listBlocked(@CurrentUser() user: RequestUser) {
    return this.usersService.listBlocked(user.userId);
  }

  @Post('report')
  report(@CurrentUser() user: RequestUser, @Body() dto: ReportUserDto) {
    return this.usersService.reportUser(user.userId, dto);
  }

  @Post('block/:targetUserId')
  block(
    @CurrentUser() user: RequestUser,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.usersService
      .blockUser(user.userId, targetUserId)
      .then(() => ({ message: 'User blocked' }));
  }

  @Delete('block/:targetUserId')
  unblock(
    @CurrentUser() user: RequestUser,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.usersService
      .unblockUser(user.userId, targetUserId)
      .then(() => ({ message: 'User unblocked' }));
  }

  @Post('fcm-token')
  registerFcmToken(
    @CurrentUser() user: RequestUser,
    @Body() body: RegisterFcmTokenDto,
  ) {
    return this.usersService
      .addFcmToken(user.userId, body.token)
      .then(() => ({ message: 'FCM token registered' }));
  }

  @Delete('fcm-token')
  removeFcmToken(
    @CurrentUser() user: RequestUser,
    @Body() body: RegisterFcmTokenDto,
  ) {
    return this.usersService
      .removeFcmToken(user.userId, body.token)
      .then(() => ({ message: 'FCM token removed' }));
  }

  @Get('sessions')
  getActiveSessions(@CurrentUser() user: RequestUser) {
    return this.redisService
      .countSessions(user.userId)
      .then((count) => ({ activeSessions: count }));
  }

  @Delete('sessions')
  revokeAllSessions(@CurrentUser() user: RequestUser) {
    return this.redisService
      .deleteAllRefreshTokens(user.userId)
      .then(() => ({
        message: 'All sessions revoked. Please log in again.',
      }));
  }

  @Get(':userId/profile')
  getProfile(@Param('userId') userId: string) {
    return this.usersService.getPublicProfile(userId);
  }

  @Get(':userId/stats')
  getStats(@Param('userId') userId: string) {
    return this.usersService.getStats(userId);
  }
}
