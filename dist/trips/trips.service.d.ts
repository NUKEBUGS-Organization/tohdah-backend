import { Model } from 'mongoose';
import { TripDocument, PricingType, TripStatus } from './schemas/trip.schema';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { BrowseTripsQueryDto } from './dto/browse-trips-query.dto';
export declare class TripsService {
    private readonly tripModel;
    constructor(tripModel: Model<TripDocument>);
    assertDateOrder(departure: Date, arrival: Date): void;
    assertPricing(pricingType: PricingType, pricePerKg: number | undefined): void;
    create(travelerId: string, dto: CreateTripDto): Promise<TripDocument>;
    getMyTrips(travelerId: string, status?: TripStatus): Promise<TripDocument[]>;
    findByIdOrThrow(id: string): Promise<TripDocument>;
    update(travelerId: string, id: string, dto: UpdateTripDto): Promise<TripDocument>;
    cancelTrip(travelerId: string, id: string): Promise<{
        message: string;
    }>;
    browse(query: BrowseTripsQueryDto): Promise<{
        data: TripDocument[] | Record<string, unknown>[];
        total: number;
        page: number;
        limit: number;
    }>;
}
