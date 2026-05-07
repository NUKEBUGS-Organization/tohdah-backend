import type { RawBodyRequest } from '@nestjs/common/interfaces/http/raw-body-request.interface';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { BookingsService } from '../bookings/bookings.service';
import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    private readonly bookingsService;
    private readonly config;
    constructor(paymentsService: PaymentsService, bookingsService: BookingsService, config: ConfigService);
    createIntent(bookingId: string, user: RequestUser): Promise<{
        clientSecret: string;
        paymentIntentId: string;
    }>;
    handleWebhook(req: RawBodyRequest<Request>, signature: string | undefined): Promise<{
        received: boolean;
    }>;
}
