import { HydratedDocument, Types } from 'mongoose';
export type ReviewDocument = HydratedDocument<Review>;
export declare class CategoryRatings {
    communication?: number;
    reliability?: number;
    itemCare?: number;
    punctuality?: number;
}
export declare class Review {
    bookingId: Types.ObjectId;
    reviewerId: Types.ObjectId;
    revieweeId: Types.ObjectId;
    overallRating: number;
    categoryRatings?: CategoryRatings;
    comment?: string;
    isVisible: boolean;
}
export declare const ReviewSchema: import("mongoose").Schema<Review, import("mongoose").Model<Review, any, any, any, any, any, Review>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Review, import("mongoose").Document<unknown, {}, Review, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    bookingId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Review, import("mongoose").Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reviewerId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Review, import("mongoose").Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    revieweeId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Review, import("mongoose").Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    overallRating?: import("mongoose").SchemaDefinitionProperty<number, Review, import("mongoose").Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    categoryRatings?: import("mongoose").SchemaDefinitionProperty<CategoryRatings | undefined, Review, import("mongoose").Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    comment?: import("mongoose").SchemaDefinitionProperty<string | undefined, Review, import("mongoose").Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isVisible?: import("mongoose").SchemaDefinitionProperty<boolean, Review, import("mongoose").Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Review>;
