import { HydratedDocument, Types } from 'mongoose';
export type TripDocument = HydratedDocument<Trip>;
export declare const LUGGAGE_SPACES: readonly ["small", "medium", "large"];
export type LuggageSpace = (typeof LUGGAGE_SPACES)[number];
export declare const PRICING_TYPES: readonly ["fixed", "negotiable"];
export type PricingType = (typeof PRICING_TYPES)[number];
export declare const TRIP_STATUSES: readonly ["active", "completed", "cancelled"];
export type TripStatus = (typeof TRIP_STATUSES)[number];
export declare class Trip {
    travelerId: Types.ObjectId;
    origin: string;
    destination: string;
    departureDate: Date;
    arrivalDate: Date;
    luggageSpace: LuggageSpace;
    acceptedCategories: string[];
    deliveryPreferences?: string;
    pricingType: PricingType;
    pricePerKg?: number;
    notes?: string;
    status: TripStatus;
    openToCommunitySupport: boolean;
    willingToAssistElderly: boolean;
    acceptReducedFee: boolean;
    acceptVolunteer: boolean;
    matchedRequestsCount: number;
}
export declare const TripSchema: import("mongoose").Schema<Trip, import("mongoose").Model<Trip, any, any, any, any, any, Trip>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Trip, import("mongoose").Document<unknown, {}, Trip, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Trip & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    travelerId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Trip, import("mongoose").Document<unknown, {}, Trip, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trip & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    origin?: import("mongoose").SchemaDefinitionProperty<string, Trip, import("mongoose").Document<unknown, {}, Trip, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trip & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    destination?: import("mongoose").SchemaDefinitionProperty<string, Trip, import("mongoose").Document<unknown, {}, Trip, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trip & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    departureDate?: import("mongoose").SchemaDefinitionProperty<Date, Trip, import("mongoose").Document<unknown, {}, Trip, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trip & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    arrivalDate?: import("mongoose").SchemaDefinitionProperty<Date, Trip, import("mongoose").Document<unknown, {}, Trip, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trip & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    luggageSpace?: import("mongoose").SchemaDefinitionProperty<"small" | "medium" | "large", Trip, import("mongoose").Document<unknown, {}, Trip, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trip & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    acceptedCategories?: import("mongoose").SchemaDefinitionProperty<string[], Trip, import("mongoose").Document<unknown, {}, Trip, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trip & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    deliveryPreferences?: import("mongoose").SchemaDefinitionProperty<string | undefined, Trip, import("mongoose").Document<unknown, {}, Trip, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trip & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    pricingType?: import("mongoose").SchemaDefinitionProperty<"fixed" | "negotiable", Trip, import("mongoose").Document<unknown, {}, Trip, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trip & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    pricePerKg?: import("mongoose").SchemaDefinitionProperty<number | undefined, Trip, import("mongoose").Document<unknown, {}, Trip, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trip & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    notes?: import("mongoose").SchemaDefinitionProperty<string | undefined, Trip, import("mongoose").Document<unknown, {}, Trip, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trip & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<"active" | "completed" | "cancelled", Trip, import("mongoose").Document<unknown, {}, Trip, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trip & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    openToCommunitySupport?: import("mongoose").SchemaDefinitionProperty<boolean, Trip, import("mongoose").Document<unknown, {}, Trip, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trip & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    willingToAssistElderly?: import("mongoose").SchemaDefinitionProperty<boolean, Trip, import("mongoose").Document<unknown, {}, Trip, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trip & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    acceptReducedFee?: import("mongoose").SchemaDefinitionProperty<boolean, Trip, import("mongoose").Document<unknown, {}, Trip, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trip & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    acceptVolunteer?: import("mongoose").SchemaDefinitionProperty<boolean, Trip, import("mongoose").Document<unknown, {}, Trip, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trip & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    matchedRequestsCount?: import("mongoose").SchemaDefinitionProperty<number, Trip, import("mongoose").Document<unknown, {}, Trip, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trip & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Trip>;
