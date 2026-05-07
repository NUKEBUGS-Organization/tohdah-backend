import { HydratedDocument, Types } from 'mongoose';
export type RequestDocument = HydratedDocument<Request>;
export declare const REQUEST_TYPES: readonly ["standard", "support"];
export type RequestType = (typeof REQUEST_TYPES)[number];
export declare const ITEM_CATEGORIES: readonly ["documents", "clothing", "electronics", "food", "gifts", "other"];
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];
export declare const ITEM_SIZES: readonly ["small", "medium", "large"];
export type ItemSize = (typeof ITEM_SIZES)[number];
export declare const PAYMENT_TYPES: readonly ["full", "reduced", "sponsored", "volunteer"];
export type SupportPaymentType = (typeof PAYMENT_TYPES)[number];
export declare const BENEFICIARY_TYPES: readonly ["elderly", "limited_mobility", "essential_care", "community", "urgent"];
export type BeneficiaryType = (typeof BENEFICIARY_TYPES)[number];
export declare const URGENCY_LEVELS: readonly ["low", "medium", "high", "critical"];
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];
export declare const REQUEST_STATUSES: readonly ["pending", "matched", "confirmed", "in_transit", "delivered", "completed", "cancelled"];
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export declare const ADMIN_APPROVAL_STATUSES: readonly ["pending_review", "approved", "rejected"];
export type AdminApprovalStatus = (typeof ADMIN_APPROVAL_STATUSES)[number];
export declare class Request {
    requesterId: Types.ObjectId;
    type: RequestType;
    itemName: string;
    itemDescription: string;
    itemCategory: ItemCategory;
    itemSize: ItemSize;
    estimatedValue?: number;
    origin: string;
    destination: string;
    deliveryDeadline: Date;
    budget?: number;
    currency: string;
    paymentType?: SupportPaymentType;
    beneficiaryName?: string;
    beneficiaryType?: BeneficiaryType;
    urgencyLevel: UrgencyLevel;
    supportingNotes?: string;
    status: RequestStatus;
    matchedTravelerId?: Types.ObjectId;
    matchedTripId?: Types.ObjectId;
    adminApprovalStatus?: AdminApprovalStatus;
    adminApprovalNotes?: string;
    adminReviewedBy?: Types.ObjectId;
    adminReviewedAt?: Date;
}
export declare const RequestSchema: import("mongoose").Schema<Request, import("mongoose").Model<Request, any, any, any, any, any, Request>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Request, import("mongoose").Document<unknown, {}, Request, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    requesterId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<"standard" | "support", Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    itemName?: import("mongoose").SchemaDefinitionProperty<string, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    itemDescription?: import("mongoose").SchemaDefinitionProperty<string, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    itemCategory?: import("mongoose").SchemaDefinitionProperty<"documents" | "clothing" | "electronics" | "food" | "gifts" | "other", Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    itemSize?: import("mongoose").SchemaDefinitionProperty<"small" | "medium" | "large", Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    estimatedValue?: import("mongoose").SchemaDefinitionProperty<number | undefined, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    origin?: import("mongoose").SchemaDefinitionProperty<string, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    destination?: import("mongoose").SchemaDefinitionProperty<string, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    deliveryDeadline?: import("mongoose").SchemaDefinitionProperty<Date, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    budget?: import("mongoose").SchemaDefinitionProperty<number | undefined, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    currency?: import("mongoose").SchemaDefinitionProperty<string, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    paymentType?: import("mongoose").SchemaDefinitionProperty<"full" | "reduced" | "sponsored" | "volunteer" | undefined, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    beneficiaryName?: import("mongoose").SchemaDefinitionProperty<string | undefined, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    beneficiaryType?: import("mongoose").SchemaDefinitionProperty<"elderly" | "limited_mobility" | "essential_care" | "community" | "urgent" | undefined, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    urgencyLevel?: import("mongoose").SchemaDefinitionProperty<"medium" | "low" | "high" | "critical", Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    supportingNotes?: import("mongoose").SchemaDefinitionProperty<string | undefined, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<"confirmed" | "in_transit" | "delivered" | "completed" | "cancelled" | "pending" | "matched", Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    matchedTravelerId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    matchedTripId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    adminApprovalStatus?: import("mongoose").SchemaDefinitionProperty<"pending_review" | "approved" | "rejected" | undefined, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    adminApprovalNotes?: import("mongoose").SchemaDefinitionProperty<string | undefined, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    adminReviewedBy?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    adminReviewedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Request, import("mongoose").Document<unknown, {}, Request, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Request & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Request>;
