import { HydratedDocument, Types } from 'mongoose';
export type BookingDocument = HydratedDocument<Booking>;
export declare const BOOKING_STATUSES: readonly ["pending_acceptance", "countered", "confirmed", "paid", "in_transit", "delivered", "completed", "cancelled", "disputed"];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export declare class Booking {
    bookingRef: string;
    requestId: Types.ObjectId;
    tripId: Types.ObjectId;
    requesterId: Types.ObjectId;
    travelerId: Types.ObjectId;
    offeredFee: number;
    counterFee?: number;
    agreedFee?: number;
    platformCommissionPct: number;
    platformCommission?: number;
    travelerPayout?: number;
    currency: string;
    status: BookingStatus;
    podPhotoUrl?: string;
    podConfirmationCode?: string;
    podSubmittedAt?: Date;
    disputeReason?: string;
    disputeRaisedAt?: Date;
    disputeRaisedBy?: Types.ObjectId;
    disputeResolution?: string;
    disputeResolvedAt?: Date;
    disputeResolvedBy?: Types.ObjectId;
    refundAmount?: number;
    completedAt?: Date;
    cancelledBy?: Types.ObjectId;
    cancelledAt?: Date;
    cancellationReason?: string;
    paymentMethodId?: string;
    paymentIntentId?: string;
}
export declare const BookingSchema: import("mongoose").Schema<Booking, import("mongoose").Model<Booking, any, any, any, any, any, Booking>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Booking, import("mongoose").Document<unknown, {}, Booking, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    bookingRef?: import("mongoose").SchemaDefinitionProperty<string, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    requestId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    tripId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    requesterId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    travelerId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    offeredFee?: import("mongoose").SchemaDefinitionProperty<number, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    counterFee?: import("mongoose").SchemaDefinitionProperty<number | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    agreedFee?: import("mongoose").SchemaDefinitionProperty<number | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    platformCommissionPct?: import("mongoose").SchemaDefinitionProperty<number, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    platformCommission?: import("mongoose").SchemaDefinitionProperty<number | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    travelerPayout?: import("mongoose").SchemaDefinitionProperty<number | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    currency?: import("mongoose").SchemaDefinitionProperty<string, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<"pending_acceptance" | "countered" | "confirmed" | "paid" | "in_transit" | "delivered" | "completed" | "cancelled" | "disputed", Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    podPhotoUrl?: import("mongoose").SchemaDefinitionProperty<string | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    podConfirmationCode?: import("mongoose").SchemaDefinitionProperty<string | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    podSubmittedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    disputeReason?: import("mongoose").SchemaDefinitionProperty<string | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    disputeRaisedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    disputeRaisedBy?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    disputeResolution?: import("mongoose").SchemaDefinitionProperty<string | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    disputeResolvedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    disputeResolvedBy?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    refundAmount?: import("mongoose").SchemaDefinitionProperty<number | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    completedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cancelledBy?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cancelledAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cancellationReason?: import("mongoose").SchemaDefinitionProperty<string | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    paymentMethodId?: import("mongoose").SchemaDefinitionProperty<string | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    paymentIntentId?: import("mongoose").SchemaDefinitionProperty<string | undefined, Booking, import("mongoose").Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Booking>;
