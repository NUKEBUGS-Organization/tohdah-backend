import { LUGGAGE_SPACES } from '../schemas/trip.schema';
export declare class BrowseTripsQueryDto {
    origin?: string;
    destination?: string;
    dateFrom?: string;
    dateTo?: string;
    luggageSpace?: (typeof LUGGAGE_SPACES)[number];
    category?: string;
    maxPrice?: number;
    socialImpact?: boolean;
    page?: number;
    limit?: number;
}
