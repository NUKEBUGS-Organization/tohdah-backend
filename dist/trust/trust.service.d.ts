import { Model } from 'mongoose';
import type { UserDocument } from '../users/schemas/user.schema';
import { BookingDocument } from '../bookings/schemas/booking.schema';
import { RequestDocument } from '../requests/schemas/request.schema';
import { UsersService } from '../users/users.service';
import type { TrustResult } from './trust.types';
export declare class TrustService {
    private readonly usersService;
    private readonly bookingModel;
    private readonly requestModel;
    constructor(usersService: UsersService, bookingModel: Model<BookingDocument>, requestModel: Model<RequestDocument>);
    private line;
    calculateTrustScore(user: UserDocument, completedBookings: number, supportDeliveries: number): TrustResult;
    private requestCollection;
    countCompletedParticipantBookings(userId: string): Promise<number>;
    countCompletedSupportDeliveries(travelerId: string): Promise<number>;
    getTrustResult(userId: string): Promise<TrustResult>;
    verifyFieldStub(userId: string, field: 'email' | 'phone' | 'id' | 'selfie'): Promise<TrustResult>;
    getBadges(userId: string): Promise<{
        badge: string;
        earned: boolean;
    }[]>;
}
