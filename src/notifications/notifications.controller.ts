import { Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { NotificationsService } from './notifications.service';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @Query() query: GetNotificationsQueryDto,
  ) {
    return this.notificationsService.getNotifications(user.userId, {
      isRead: query.isRead,
      type: query.type,
      page: query.page,
      limit: query.limit,
    });
  }

  @Patch('read-all')
  markAll(@CurrentUser() user: RequestUser) {
    return this.notificationsService.markAllRead(user.userId);
  }

  @Patch(':id/read')
  markOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.notificationsService.markRead(user.userId, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.notificationsService.deleteNotification(user.userId, id);
  }
}
