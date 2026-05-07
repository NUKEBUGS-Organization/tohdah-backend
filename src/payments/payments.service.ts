import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

/** Narrow shape used after `webhooks.constructEvent` verification. */
export type StripeVerifiedEvent = {
  type: string;
  data: { object: { id: string; metadata?: Record<string, string> } };
};

@Injectable()
export class PaymentsService {
  private stripeClient: InstanceType<typeof Stripe> | null = null;

  constructor(private readonly config: ConfigService) {}

  private getStripe(): InstanceType<typeof Stripe> {
    const secret = this.config.get<string>('STRIPE_SECRET_KEY')?.trim();
    if (!secret) {
      throw new BadRequestException('Stripe is not configured');
    }
    if (!this.stripeClient) {
      this.stripeClient = new Stripe(secret, { typescript: true });
    }
    return this.stripeClient;
  }

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    bookingId: string;
    requesterId: string;
  }): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const stripe = this.getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100),
      currency: params.currency.toLowerCase(),
      metadata: {
        bookingId: params.bookingId,
        requesterId: params.requesterId,
      },
    });
    return {
      clientSecret: intent.client_secret!,
      paymentIntentId: intent.id,
    };
  }

  async handlePaymentSuccess(paymentIntentId: string): Promise<string> {
    const stripe = this.getStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const bookingId = intent.metadata?.bookingId;
    if (!bookingId) {
      throw new Error('PaymentIntent missing bookingId metadata');
    }
    return bookingId;
  }

  async refundPayment(params: {
    paymentIntentId: string;
    amount?: number;
  }): Promise<void> {
    const stripe = this.getStripe();
    await stripe.refunds.create({
      payment_intent: params.paymentIntentId,
      ...(params.amount !== undefined && params.amount !== null
        ? { amount: Math.round(params.amount * 100) }
        : {}),
    });
  }

  constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): StripeVerifiedEvent {
    const stripe = this.getStripe();
    const secret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      secret,
    ) as StripeVerifiedEvent;
  }
}
