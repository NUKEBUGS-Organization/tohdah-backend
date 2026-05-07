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
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { GetMyTripsQueryDto } from './dto/get-my-trips-query.dto';
import { BrowseTripsQueryDto } from './dto/browse-trips-query.dto';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateTripDto) {
    return this.tripsService.create(user.userId, dto);
  }

  @Get('my')
  getMyTrips(
    @CurrentUser() user: RequestUser,
    @Query() query: GetMyTripsQueryDto,
  ) {
    return this.tripsService.getMyTrips(user.userId, query.status);
  }

  @Get('browse')
  browse(@Query() query: BrowseTripsQueryDto) {
    return this.tripsService.browse(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripsService.findByIdOrThrow(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateTripDto,
  ) {
    return this.tripsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.tripsService.cancelTrip(user.userId, id);
  }
}
