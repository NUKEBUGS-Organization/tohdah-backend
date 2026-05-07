import { HydratedDocument, Types } from 'mongoose';
export type UserReportDocument = HydratedDocument<UserReport>;
export declare const REPORT_REASONS: readonly ["spam", "fraud", "harassment", "fake_profile", "other"];
export type ReportReason = (typeof REPORT_REASONS)[number];
export declare const REPORT_STATUSES: readonly ["pending", "reviewed", "resolved"];
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export declare class UserReport {
    reporterId: Types.ObjectId;
    targetUserId: Types.ObjectId;
    reason: ReportReason;
    description?: string;
    status: ReportStatus;
}
export declare const UserReportSchema: import("mongoose").Schema<UserReport, import("mongoose").Model<UserReport, any, any, any, any, any, UserReport>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, UserReport, import("mongoose").Document<unknown, {}, UserReport, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<UserReport & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    reporterId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, UserReport, import("mongoose").Document<unknown, {}, UserReport, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserReport & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    targetUserId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, UserReport, import("mongoose").Document<unknown, {}, UserReport, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserReport & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reason?: import("mongoose").SchemaDefinitionProperty<"other" | "spam" | "fraud" | "harassment" | "fake_profile", UserReport, import("mongoose").Document<unknown, {}, UserReport, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserReport & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string | undefined, UserReport, import("mongoose").Document<unknown, {}, UserReport, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserReport & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<"pending" | "reviewed" | "resolved", UserReport, import("mongoose").Document<unknown, {}, UserReport, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserReport & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, UserReport>;
