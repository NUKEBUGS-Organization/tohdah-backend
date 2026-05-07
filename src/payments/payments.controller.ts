import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common/interfaces/http/raw-body-request.interface';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { StripeVerifiedEvent } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { BookingsService } from '../bookings/bookings.service';
import { SkipAllThrottlers } from '../common/decorators/throttle.decorator';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly bookingsService: BookingsService,
    private readonly config: ConfigService,
  ) {}

  @Post('intent/:bookingId')
  @UseGuards(JwtAuthGuard)
  async createIntent(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const booking = await this.bookingsService.findOneForParty(
      bookingId,
      user.userId,
    );
    if (booking.status !== 'confirmed') {
      throw new BadRequestException(
        'Booking must be confirmed before payment',
      );
    }
    if (booking.requesterId.toString() !== user.userId) {
      throw new ForbiddenException('Only the requester can initiate payment');
    }
    const fee = booking.agreedFee ?? booking.counterFee ?? booking.offeredFee;
    const currency =
      booking.currency ??
      this.config.get<string>('STRIPE_CURRENCY', 'usd') ??
      'usd';
    return this.paymentsService.createPaymentIntent({
      amount: fee,
      currency,
      bookingId: booking._id.toString(),
      requesterId: user.userId,
    });
  }

  @Post('webhook')
  @SkipAllThrottlers()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }
    const raw = req.rawBody;
    if (!raw) {
      throw new BadRequestException('Missing raw body');
    }
    let event: StripeVerifiedEvent;
    try {
      event = this.paymentsService.constructWebhookEvent(raw, signature);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const bookingId = await this.paymentsService.handlePaymentSuccess(
        intent.id,
      );
      await this.bookingsService.markAsPaidFromWebhook(bookingId, intent.id);
    }
    return { received: true };
  }
}
