import { LUGGAGE_SPACES, PRICING_TYPES } from '../schemas/trip.schema';
export declare class CreateTripDto {
    origin: string;
    destination: string;
    departureDate: string;
    arrivalDate: string;
    luggageSpace: (typeof LUGGAGE_SPACES)[number];
    acceptedCategories?: string[];
    deliveryPreferences?: string;
    pricingType: (typeof PRICING_TYPES)[number];
    pricePerKg?: number;
    notes?: string;
    openToCommunitySupport?: boolean;
    willingToAssistElderly?: boolean;
    acceptReducedFee?: boolean;
    acceptVolunteer?: boolean;
}
