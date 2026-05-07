import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { AdminService } from './admin.service';
import { BanUserDto, SuspendUserDto } from './dto/suspend-ban.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { ApproveSupportDto, RejectSupportDto } from './dto/support-notes.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getStats(): Promise<{
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
    listUsers(q: Record<string, string | undefined>): Promise<{
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
    listTrips(q: Record<string, string | undefined>): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../trips/schemas/trip.schema").Trip, {}, import("mongoose").DefaultSchemaOptions> & import("../trips/schemas/trip.schema").Trip & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../trips/schemas/trip.schema").Trip, {}, import("mongoose").DefaultSchemaOptions> & import("../trips/schemas/trip.schema").Trip & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        total: number;
        page: number;
        limit: number;
    }>;
    listRequests(q: Record<string, string | undefined>): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../requests/schemas/request.schema").Request, {}, import("mongoose").DefaultSchemaOptions> & import("../requests/schemas/request.schema").Request & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../requests/schemas/request.schema").Request, {}, import("mongoose").DefaultSchemaOptions> & import("../requests/schemas/request.schema").Request & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        total: number;
        page: number;
        limit: number;
    }>;
    listBookings(q: Record<string, string | undefined>): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../bookings/schemas/booking.schema").Booking, {}, import("mongoose").DefaultSchemaOptions> & import("../bookings/schemas/booking.schema").Booking & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../bookings/schemas/booking.schema").Booking, {}, import("mongoose").DefaultSchemaOptions> & import("../bookings/schemas/booking.schema").Booking & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        total: number;
        page: number;
        limit: number;
    }>;
    listDisputes(q: Record<string, string | undefined>): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../bookings/schemas/booking.schema").Booking, {}, import("mongoose").DefaultSchemaOptions> & import("../bookings/schemas/booking.schema").Booking & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../bookings/schemas/booking.schema").Booking, {}, import("mongoose").DefaultSchemaOptions> & import("../bookings/schemas/booking.schema").Booking & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        total: number;
        page: number;
        limit: number;
    }>;
    resolveDispute(admin: RequestUser, bookingId: string, dto: ResolveDisputeDto): Promise<{
        message: string;
        booking: import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../bookings/schemas/booking.schema").Booking, {}, import("mongoose").DefaultSchemaOptions> & import("../bookings/schemas/booking.schema").Booking & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../bookings/schemas/booking.schema").Booking, {}, import("mongoose").DefaultSchemaOptions> & import("../bookings/schemas/booking.schema").Booking & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>;
    }>;
    listSupportRequests(q: Record<string, string | undefined>): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    approveSupport(admin: RequestUser, requestId: string, dto: ApproveSupportDto): Promise<{
        message: string;
        request: import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../requests/schemas/request.schema").Request, {}, import("mongoose").DefaultSchemaOptions> & import("../requests/schemas/request.schema").Request & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../requests/schemas/request.schema").Request, {}, import("mongoose").DefaultSchemaOptions> & import("../requests/schemas/request.schema").Request & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>;
    }>;
    rejectSupport(admin: RequestUser, requestId: string, dto: RejectSupportDto): Promise<{
        message: string;
        request: import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../requests/schemas/request.schema").Request, {}, import("mongoose").DefaultSchemaOptions> & import("../requests/schemas/request.schema").Request & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../requests/schemas/request.schema").Request, {}, import("mongoose").DefaultSchemaOptions> & import("../requests/schemas/request.schema").Request & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>;
    }>;
    getImpact(q: Record<string, string | undefined>): Promise<{
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
    listReferrals(q: Record<string, string | undefined>): Promise<{
        data: {
            id: string;
            fullName: string;
            email: string;
            loyaltyPoints: number;
            createdAt: Date | undefined;
            referredBy: import("mongoose").Types.ObjectId | undefined;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    loyalty(): Promise<{
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
    suspend(_admin: RequestUser, userId: string, dto: SuspendUserDto): Promise<{
        message: string;
        userId: string;
    }>;
    ban(_admin: RequestUser, userId: string, dto: BanUserDto): Promise<{
        message: string;
        userId: string;
    }>;
    reinstate(admin: RequestUser, userId: string): Promise<{
        message: string;
        userId: string;
    }>;
    updateRole(admin: RequestUser, userId: string, dto: UpdateUserRoleDto): Promise<{
        message: string;
        userId: string;
        role: "user" | "admin";
    }>;
    getUser(userId: string): Promise<{
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
}
