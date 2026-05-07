import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { GetMyTripsQueryDto } from './dto/get-my-trips-query.dto';
import { BrowseTripsQueryDto } from './dto/browse-trips-query.dto';
export declare class TripsController {
    private readonly tripsService;
    constructor(tripsService: TripsService);
    create(user: RequestUser, dto: CreateTripDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/trip.schema").Trip, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/trip.schema").Trip & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    getMyTrips(user: RequestUser, query: GetMyTripsQueryDto): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/trip.schema").Trip, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/trip.schema").Trip & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    })[]>;
    browse(query: BrowseTripsQueryDto): Promise<{
        data: import("./schemas/trip.schema").TripDocument[] | Record<string, unknown>[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/trip.schema").Trip, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/trip.schema").Trip & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    update(user: RequestUser, id: string, dto: UpdateTripDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/trip.schema").Trip, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/trip.schema").Trip & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    cancel(user: RequestUser, id: string): Promise<{
        message: string;
    }>;
}
