import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CounterOfferDto } from './dto/counter-offer.dto';
import { ProofOfDeliveryDto } from './dto/proof-of-delivery.dto';
import { DisputeDto } from './dto/dispute.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { PayBookingDto } from './dto/pay-booking.dto';
import { GetMyBookingsQueryDto } from './dto/get-my-bookings-query.dto';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('match')
  createMatch(@CurrentUser() user: RequestUser, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createMatch(user.userId, dto);
  }

  @Get('my')
  getMy(@CurrentUser() user: RequestUser, @Query() query: GetMyBookingsQueryDto) {
    return this.bookingsService.findMyBookings(user.userId, {
      status: query.status,
      role: query.role,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.bookingsService.findOneForParty(id, user.userId);
  }

  @Post(':id/accept')
  accept(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.bookingsService.acceptBooking(user.userId, id);
  }

  @Post(':id/counter')
  counter(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CounterOfferDto,
  ) {
    return this.bookingsService.counterOffer(user.userId, id, dto);
  }

  @Post(':id/decline')
  decline(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.bookingsService.declineBooking(user.userId, id);
  }

  @Post(':id/accept-counter')
  acceptCounter(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.bookingsService.acceptCounter(user.userId, id);
  }

  @Post(':id/pay')
  pay(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: PayBookingDto,
  ) {
    return this.bookingsService.pay(user.userId, id, dto);
  }

  @Post(':id/in-transit')
  inTransit(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.bookingsService.markInTransit(user.userId, id);
  }

  @Post(':id/proof-of-delivery')
  proofOfDelivery(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ProofOfDeliveryDto,
  ) {
    return this.bookingsService.submitProofOfDelivery(user.userId, id, dto);
  }

  @Post(':id/complete')
  complete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.bookingsService.completeBooking(user.userId, id);
  }

  @Post(':id/dispute')
  dispute(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: DisputeDto,
  ) {
    return this.bookingsService.raiseDispute(user.userId, id, dto);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(user.userId, id, dto);
  }
}
