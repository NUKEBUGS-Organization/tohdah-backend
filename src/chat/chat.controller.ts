import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('my')
  getMy(@CurrentUser() user: RequestUser) {
    return this.chatService.getMyConversations(user.userId);
  }

  @Get(':bookingId/messages')
  getMessages(
    @CurrentUser() user: RequestUser,
    @Param('bookingId') bookingId: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.chatService.getMessages(
      user.userId,
      bookingId,
      query.page,
      query.limit,
    );
  }

  @Post(':bookingId/messages')
  send(
    @CurrentUser() user: RequestUser,
    @Param('bookingId') bookingId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user.userId, bookingId, dto);
  }

  @Patch('messages/:messageId/read')
  markRead(
    @CurrentUser() user: RequestUser,
    @Param('messageId') messageId: string,
  ) {
    return this.chatService.markMessageRead(user.userId, messageId);
  }
}
