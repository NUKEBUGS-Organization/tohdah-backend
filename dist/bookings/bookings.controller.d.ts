import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CounterOfferDto } from './dto/counter-offer.dto';
import { ProofOfDeliveryDto } from './dto/proof-of-delivery.dto';
import { DisputeDto } from './dto/dispute.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { PayBookingDto } from './dto/pay-booking.dto';
import { GetMyBookingsQueryDto } from './dto/get-my-bookings-query.dto';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    createMatch(user: RequestUser, dto: CreateBookingDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/booking.schema").Booking, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/booking.schema").Booking & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    getMy(user: RequestUser, query: GetMyBookingsQueryDto): Promise<{
        data: import("./schemas/booking.schema").BookingDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(user: RequestUser, id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/booking.schema").Booking, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/booking.schema").Booking & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    accept(user: RequestUser, id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/booking.schema").Booking, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/booking.schema").Booking & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    counter(user: RequestUser, id: string, dto: CounterOfferDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/booking.schema").Booking, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/booking.schema").Booking & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    decline(user: RequestUser, id: string): Promise<{
        message: string;
    }>;
    acceptCounter(user: RequestUser, id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/booking.schema").Booking, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/booking.schema").Booking & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    pay(user: RequestUser, id: string, dto: PayBookingDto): Promise<{
        booking: import("./schemas/booking.schema").BookingDocument;
        message: string;
    }>;
    inTransit(user: RequestUser, id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/booking.schema").Booking, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/booking.schema").Booking & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    proofOfDelivery(user: RequestUser, id: string, dto: ProofOfDeliveryDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/booking.schema").Booking, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/booking.schema").Booking & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    complete(user: RequestUser, id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/booking.schema").Booking, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/booking.schema").Booking & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    dispute(user: RequestUser, id: string, dto: DisputeDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/booking.schema").Booking, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/booking.schema").Booking & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    cancel(user: RequestUser, id: string, dto: CancelBookingDto): Promise<{
        message: string;
    }>;
}
