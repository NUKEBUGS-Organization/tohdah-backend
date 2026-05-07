import { BOOKING_STATUSES } from '../schemas/booking.schema';
export declare class GetMyBookingsQueryDto {
    status?: (typeof BOOKING_STATUSES)[number];
    role?: 'requester' | 'traveler';
    page?: number;
    limit?: number;
}
