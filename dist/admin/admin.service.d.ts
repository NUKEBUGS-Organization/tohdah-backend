import { Model, Types } from 'mongoose';
import type { UserDocument } from '../users/schemas/user.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Trip, TripDocument } from '../trips/schemas/trip.schema';
import { Request as RequestEntity, RequestDocument } from '../requests/schemas/request.schema';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { PaymentsService } from '../payments/payments.service';
import { RedisService } from '../common/redis/redis.service';
export declare class AdminService {
    private readonly userModel;
    private readonly bookingModel;
    private readonly tripModel;
    private readonly requestModel;
    private readonly usersService;
    private readonly notificationsService;
    private readonly paymentsService;
    private readonly redisService;
    private readonly logger;
    constructor(userModel: Model<UserDocument>, bookingModel: Model<BookingDocument>, tripModel: Model<TripDocument>, requestModel: Model<RequestDocument>, usersService: UsersService, notificationsService: NotificationsService, paymentsService: PaymentsService, redisService: RedisService);
    private requestCollection;
    getPlatformStats(): Promise<{
        users: {
            total: number;
            newToday: number;
            newThisWeek: number;
            travelers: number;
            requesters: number;
            verified: number;
        };
        trips: {
            total: number;
            active: number;
            completed: number;
            cancelled: number;
        };
        requests: {
            total: number;
            pending: number;
            standard: number;
            support: number;
            completed: number;
        };
        bookings: {
            total: number;
            active: number;
            completed: number;
            disputed: number;
            cancelled: number;
        };
        revenue: {
            totalCommission: number;
            thisMonth: number;
            thisWeek: number;
        };
        impact: {
            supportRequestsTotal: number;
            supportRequestsFulfilled: number;
            volunteerDeliveries: number;
            elderlyAssisted: number;
            communityChampions: number;
        };
    }>;
    private targetIsPrivileged;
    suspendUser(actorId: string, targetUserId: string, reason: string): Promise<{
        message: string;
        userId: string;
    }>;
    banUser(actorId: string, targetUserId: string, reason: string): Promise<{
        message: string;
        userId: string;
    }>;
    reinstateUser(_actorId: string, targetUserId: string): Promise<{
        message: string;
        userId: string;
    }>;
    updateUserRole(_actorId: string, targetUserId: string, role: 'user' | 'admin'): Promise<{
        message: string;
        userId: string;
        role: "user" | "admin";
    }>;
    listUsers(query: {
        search?: string;
        role?: string;
        accountType?: string;
        status?: string;
        isVerified?: boolean;
        dateFrom?: string;
        dateTo?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: {
            id: string;
            fullName: string;
            email: string;
            phoneNumber: string;
            role: "user" | "admin" | "superadmin";
            accountType: "traveler" | "requester" | "both" | null;
            isEmailVerified: boolean;
            isPhoneVerified: boolean;
            isIdVerified: boolean;
            rating: number;
            reviewCount: number;
            accountStatus: "active" | "suspended" | "banned";
            createdAt: Date | undefined;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    private serializeUserDetail;
    getUserDetail(userId: string): Promise<{
        user: Record<string, unknown>;
        stats: import("../users/users.service").UserStatsResponse;
        recentActivity: {
            bookings: {
                id: string;
                status: "pending_acceptance" | "countered" | "confirmed" | "paid" | "in_transit" | "delivered" | "completed" | "cancelled" | "disputed";
                createdAt: Date | undefined;
            }[];
            trips: {
                id: string;
                status: "active" | "completed" | "cancelled";
                createdAt: Date | undefined;
            }[];
            requests: {
                id: string;
                status: "confirmed" | "in_transit" | "delivered" | "completed" | "cancelled" | "pending" | "matched";
                createdAt: Date | undefined;
            }[];
        };
    }>;
    listTrips(query: {
        status?: string;
        origin?: string;
        destination?: string;
        dateFrom?: string;
        dateTo?: string;
        travelerId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Trip, {}, import("mongoose").DefaultSchemaOptions> & Trip & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, Trip, {}, import("mongoose").DefaultSchemaOptions> & Trip & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: Types.ObjectId;
        }>)[];
        total: number;
        page: number;
        limit: number;
    }>;
    listRequests(query: {
        status?: string;
        type?: string;
        urgencyLevel?: string;
        origin?: string;
        destination?: string;
        requesterId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, RequestEntity, {}, import("mongoose").DefaultSchemaOptions> & RequestEntity & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, RequestEntity, {}, import("mongoose").DefaultSchemaOptions> & RequestEntity & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: Types.ObjectId;
        }>)[];
        total: number;
        page: number;
        limit: number;
    }>;
    listBookings(query: {
        status?: string;
        travelerId?: string;
        requesterId?: string;
        dateFrom?: string;
        dateTo?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Booking, {}, import("mongoose").DefaultSchemaOptions> & Booking & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, Booking, {}, import("mongoose").DefaultSchemaOptions> & Booking & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: Types.ObjectId;
        }>)[];
        total: number;
        page: number;
        limit: number;
    }>;
    listDisputes(query: {
        dateFrom?: string;
        dateTo?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Booking, {}, import("mongoose").DefaultSchemaOptions> & Booking & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, Booking, {}, import("mongoose").DefaultSchemaOptions> & Booking & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: Types.ObjectId;
        }>)[];
        total: number;
        page: number;
        limit: number;
    }>;
    resolveDispute(adminUserId: string, bookingId: string, dto: ResolveDisputeDto): Promise<{
        message: string;
        booking: import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Booking, {}, import("mongoose").DefaultSchemaOptions> & Booking & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, Booking, {}, import("mongoose").DefaultSchemaOptions> & Booking & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: Types.ObjectId;
        }>;
    }>;
    listSupportRequests(query: {
        adminApprovalStatus?: string;
        urgencyLevel?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    approveSupportRequest(adminUserId: string, requestId: string, notes?: string): Promise<{
        message: string;
        request: import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, RequestEntity, {}, import("mongoose").DefaultSchemaOptions> & RequestEntity & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, RequestEntity, {}, import("mongoose").DefaultSchemaOptions> & RequestEntity & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: Types.ObjectId;
        }>;
    }>;
    rejectSupportRequest(adminUserId: string, requestId: string, notes: string): Promise<{
        message: string;
        request: import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, RequestEntity, {}, import("mongoose").DefaultSchemaOptions> & RequestEntity & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, RequestEntity, {}, import("mongoose").DefaultSchemaOptions> & RequestEntity & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: Types.ObjectId;
        }>;
    }>;
    private impactDateFilter;
    private rqCreatedRangeStage;
    getImpact(query: {
        dateFrom?: string;
        dateTo?: string;
    }): Promise<{
        overview: {
            supportRequestsTotal: number;
            supportRequestsFulfilled: number;
            volunteerDeliveries: number;
            elderlyAssisted: number;
            communityChampions: number;
        };
        byType: {
            type: string;
            count: number;
            fulfilled: number;
        }[];
        byPaymentType: {
            paymentType: string;
            count: number;
        }[];
        topTravelers: {
            travelerId: string;
            fullName: string;
            profilePhoto: string | null;
            supportDeliveries: number;
        }[];
    }>;
    listReferrals(query: {
        page?: number;
        limit?: number;
    }): Promise<{
        data: {
            id: string;
            fullName: string;
            email: string;
            loyaltyPoints: number;
            createdAt: Date | undefined;
            referredBy: Types.ObjectId | undefined;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getLoyaltyOverview(): Promise<{
        tiers: {
            tier: string;
            count: number;
        }[];
        topUsers: {
            fullName: string;
            email: string;
            points: number;
        }[];
    }>;
}
