import { ConfigService } from '@nestjs/config';
export type StripeVerifiedEvent = {
    type: string;
    data: {
        object: {
            id: string;
            metadata?: Record<string, string>;
        };
    };
};
export declare class PaymentsService {
    private readonly config;
    private stripeClient;
    constructor(config: ConfigService);
    private getStripe;
    createPaymentIntent(params: {
        amount: number;
        currency: string;
        bookingId: string;
        requesterId: string;
    }): Promise<{
        clientSecret: string;
        paymentIntentId: string;
    }>;
    handlePaymentSuccess(paymentIntentId: string): Promise<string>;
    refundPayment(params: {
        paymentIntentId: string;
        amount?: number;
    }): Promise<void>;
    constructWebhookEvent(payload: Buffer, signature: string): StripeVerifiedEvent;
}
