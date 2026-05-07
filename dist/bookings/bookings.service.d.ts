import { Model } from 'mongoose';
import { BookingDocument, BookingStatus } from './schemas/booking.schema';
import { TripDocument } from '../trips/schemas/trip.schema';
import { RequestDocument } from '../requests/schemas/request.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CounterOfferDto } from './dto/counter-offer.dto';
import { ProofOfDeliveryDto } from './dto/proof-of-delivery.dto';
import { DisputeDto } from './dto/dispute.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { PayBookingDto } from './dto/pay-booking.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class BookingsService {
    private readonly bookingModel;
    private readonly tripModel;
    private readonly requestModel;
    private readonly notificationsService;
    constructor(bookingModel: Model<BookingDocument>, tripModel: Model<TripDocument>, requestModel: Model<RequestDocument>, notificationsService: NotificationsService);
    private notify;
    private generateUniqueBookingRef;
    private applyCommission;
    private revertMatch;
    private maybeCompleteTrip;
    createMatch(requesterUserId: string, dto: CreateBookingDto): Promise<BookingDocument>;
    acceptBooking(travelerUserId: string, bookingId: string): Promise<BookingDocument>;
    counterOffer(travelerUserId: string, bookingId: string, dto: CounterOfferDto): Promise<BookingDocument>;
    declineBooking(travelerUserId: string, bookingId: string): Promise<{
        message: string;
    }>;
    acceptCounter(requesterUserId: string, bookingId: string): Promise<BookingDocument>;
    pay(_requesterUserId: string, _bookingId: string, _dto: PayBookingDto): Promise<{
        booking: BookingDocument;
        message: string;
    }>;
    markAsPaidFromWebhook(bookingId: string, paymentIntentId: string): Promise<void>;
    markInTransit(travelerUserId: string, bookingId: string): Promise<BookingDocument>;
    submitProofOfDelivery(travelerUserId: string, bookingId: string, dto: ProofOfDeliveryDto): Promise<BookingDocument>;
    completeBooking(requesterUserId: string, bookingId: string): Promise<BookingDocument>;
    raiseDispute(userId: string, bookingId: string, dto: DisputeDto): Promise<BookingDocument>;
    cancelBooking(userId: string, bookingId: string, dto: CancelBookingDto): Promise<{
        message: string;
    }>;
    findMyBookings(userId: string, query: {
        status?: BookingStatus;
        role?: 'requester' | 'traveler';
        page?: number;
        limit?: number;
    }): Promise<{
        data: BookingDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOneForParty(bookingId: string, userId: string): Promise<BookingDocument>;
}
