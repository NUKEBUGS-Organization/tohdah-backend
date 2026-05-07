import { TRIP_STATUSES } from '../schemas/trip.schema';
export declare class GetMyTripsQueryDto {
    status?: (typeof TRIP_STATUSES)[number];
}
