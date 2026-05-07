import {
  Body,
  Controller,
  Delete,
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
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { GetMyRequestsQueryDto } from './dto/get-my-requests-query.dto';
import { BrowseRequestsQueryDto } from './dto/browse-requests-query.dto';

@Controller('requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateRequestDto) {
    return this.requestsService.create(user.userId, dto);
  }

  @Get('my')
  getMyRequests(
    @CurrentUser() user: RequestUser,
    @Query() query: GetMyRequestsQueryDto,
  ) {
    return this.requestsService.getMyRequests(
      user.userId,
      query.status,
      query.type,
    );
  }

  @Get('browse')
  browse(@Query() query: BrowseRequestsQueryDto) {
    return this.requestsService.browse(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestsService.findByIdOrThrow(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateRequestDto,
  ) {
    return this.requestsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.requestsService.cancelRequest(user.userId, id);
  }
}
