import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import type { UserDocument } from '../users/schemas/user.schema';
import { User } from '../users/schemas/user.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Trip, TripDocument } from '../trips/schemas/trip.schema';
import {
  Request as RequestEntity,
  RequestDocument,
} from '../requests/schemas/request.schema';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { PaymentsService } from '../payments/payments.service';
import { RedisService } from '../common/redis/redis.service';

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function startOfUtcWeekMonday(d: Date): Date {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const x = startOfUtcDay(d);
  x.setUTCDate(x.getUTCDate() + diff);
  return x;
}

function endOfUtcMonth(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );
}

function startOfUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function endOfUtcWeekSunday(d: Date): Date {
  const start = startOfUtcWeekMonday(d);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Trip.name) private readonly tripModel: Model<TripDocument>,
    @InjectModel(RequestEntity.name)
    private readonly requestModel: Model<RequestDocument>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly paymentsService: PaymentsService,
    private readonly redisService: RedisService,
  ) {}

  private requestCollection(): string {
    return this.requestModel.collection.name;
  }

  async getPlatformStats() {
    const now = new Date();
    const dayStart = startOfUtcDay(now);
    const weekStart = startOfUtcWeekMonday(now);
    const monthStart = startOfUtcMonth(now);
    const monthEnd = endOfUtcMonth(now);
    const weekEnd = endOfUtcWeekSunday(now);

    const [
      usersTotal,
      usersNewToday,
      usersNewThisWeek,
      travelers,
      requesters,
      verifiedEmail,
      tripsTotal,
      tripsActive,
      tripsCompleted,
      tripsCancelled,
      requestsTotal,
      requestsPending,
      requestsStandard,
      requestsSupport,
      requestsCompleted,
      bookingsTotal,
      bookingsActive,
      bookingsCompleted,
      bookingsDisputed,
      bookingsCancelled,
      revenueTotalRows,
      revenueMonthRows,
      revenueWeekRows,
      supportRequestsTotal,
      supportRequestsFulfilled,
      volunteerRows,
      elderlyAssisted,
      communityChampions,
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.userModel.countDocuments({ createdAt: { $gte: dayStart } }).exec(),
      this.userModel.countDocuments({ createdAt: { $gte: weekStart } }).exec(),
      this.userModel
        .countDocuments({
          $or: [{ accountType: 'traveler' }, { accountType: 'both' }],
        })
        .exec(),
      this.userModel
        .countDocuments({
          $or: [{ accountType: 'requester' }, { accountType: 'both' }],
        })
        .exec(),
      this.userModel.countDocuments({ isEmailVerified: true }).exec(),
      this.tripModel.countDocuments().exec(),
      this.tripModel.countDocuments({ status: 'active' }).exec(),
      this.tripModel.countDocuments({ status: 'completed' }).exec(),
      this.tripModel.countDocuments({ status: 'cancelled' }).exec(),
      this.requestModel.countDocuments().exec(),
      this.requestModel.countDocuments({ status: 'pending' }).exec(),
      this.requestModel.countDocuments({ type: 'standard' }).exec(),
      this.requestModel.countDocuments({ type: 'support' }).exec(),
      this.requestModel.countDocuments({ status: 'completed' }).exec(),
      this.bookingModel.countDocuments().exec(),
      this.bookingModel
        .countDocuments({
          status: { $in: ['confirmed', 'paid', 'in_transit'] },
        })
        .exec(),
      this.bookingModel.countDocuments({ status: 'completed' }).exec(),
      this.bookingModel.countDocuments({ status: 'disputed' }).exec(),
      this.bookingModel.countDocuments({ status: 'cancelled' }).exec(),
      this.bookingModel
        .aggregate<{ s: number }>([
          { $match: { status: 'completed' } },
          {
            $group: {
              _id: null,
              s: { $sum: { $ifNull: ['$platformCommission', 0] } },
            },
          },
        ])
        .exec(),
      this.bookingModel
        .aggregate<{ s: number }>([
          {
            $match: {
              status: 'completed',
              $or: [
                {
                  completedAt: {
                    $gte: monthStart,
                    $lte: monthEnd,
                  },
                },
                {
                  completedAt: { $exists: false },
                  updatedAt: { $gte: monthStart, $lte: monthEnd },
                },
              ],
            },
          },
          {
            $group: {
              _id: null,
              s: { $sum: { $ifNull: ['$platformCommission', 0] } },
            },
          },
        ])
        .exec(),
      this.bookingModel
        .aggregate<{ s: number }>([
          {
            $match: {
              status: 'completed',
              $or: [
                {
                  completedAt: {
                    $gte: weekStart,
                    $lte: weekEnd,
                  },
                },
                {
                  completedAt: { $exists: false },
                  updatedAt: { $gte: weekStart, $lte: weekEnd },
                },
              ],
            },
          },
          {
            $group: {
              _id: null,
              s: { $sum: { $ifNull: ['$platformCommission', 0] } },
            },
          },
        ])
        .exec(),
      this.requestModel.countDocuments({ type: 'support' }).exec(),
      this.requestModel
        .countDocuments({ type: 'support', status: 'completed' })
        .exec(),
      this.bookingModel
        .aggregate<{ n: number }>([
          { $match: { status: 'completed' } },
          {
            $lookup: {
              from: this.requestCollection(),
              localField: 'requestId',
              foreignField: '_id',
              as: 'rq',
            },
          },
          { $unwind: '$rq' },
          { $match: { 'rq.paymentType': 'volunteer' } },
          { $count: 'n' },
        ])
        .exec(),
      this.requestModel
        .countDocuments({
          type: 'support',
          beneficiaryType: 'elderly',
          status: 'completed',
        })
        .exec(),
      this.bookingModel
        .aggregate<{ n: number }>([
          { $match: { status: 'completed' } },
          {
            $lookup: {
              from: this.requestCollection(),
              localField: 'requestId',
              foreignField: '_id',
              as: 'rq',
            },
          },
          { $unwind: '$rq' },
          { $match: { 'rq.type': 'support' } },
          { $group: { _id: '$travelerId', c: { $sum: 1 } } },
          { $match: { c: { $gte: 5 } } },
          { $count: 'n' },
        ])
        .exec(),
    ]);

    return {
      users: {
        total: usersTotal,
        newToday: usersNewToday,
        newThisWeek: usersNewThisWeek,
        travelers,
        requesters,
        verified: verifiedEmail,
      },
      trips: {
        total: tripsTotal,
        active: tripsActive,
        completed: tripsCompleted,
        cancelled: tripsCancelled,
      },
      requests: {
        total: requestsTotal,
        pending: requestsPending,
        standard: requestsStandard,
        support: requestsSupport,
        completed: requestsCompleted,
      },
      bookings: {
        total: bookingsTotal,
        active: bookingsActive,
        completed: bookingsCompleted,
        disputed: bookingsDisputed,
        cancelled: bookingsCancelled,
      },
      revenue: {
        totalCommission: revenueTotalRows[0]?.s ?? 0,
        thisMonth: revenueMonthRows[0]?.s ?? 0,
        thisWeek: revenueWeekRows[0]?.s ?? 0,
      },
      impact: {
        supportRequestsTotal,
        supportRequestsFulfilled,
        volunteerDeliveries: volunteerRows[0]?.n ?? 0,
        elderlyAssisted,
        communityChampions: communityChampions[0]?.n ?? 0,
      },
    };
  }

  private targetIsPrivileged(user: UserDocument): boolean {
    const r = user.role ?? 'user';
    return r === 'admin' || r === 'superadmin';
  }

  async suspendUser(actorId: string, targetUserId: string, reason: string) {
    const target = await this.usersService.findById(targetUserId);
    if (!target) throw new NotFoundException('User not found');
    if (this.targetIsPrivileged(target)) {
      throw new ForbiddenException('Cannot suspend an administrator');
    }
    target.accountStatus = 'suspended';
    target.suspensionReason = reason;
    target.suspendedAt = new Date();
    await target.save();
    return { message: 'User suspended', userId: targetUserId };
  }

  async banUser(actorId: string, targetUserId: string, reason: string) {
    const target = await this.usersService.findById(targetUserId);
    if (!target) throw new NotFoundException('User not found');
    if (this.targetIsPrivileged(target)) {
      throw new ForbiddenException('Cannot ban an administrator');
    }
    target.accountStatus = 'banned';
    target.suspensionReason = reason;
    target.bannedAt = new Date();
    await target.save();
    await this.redisService.deleteAllRefreshTokens(targetUserId);
    return { message: 'User banned', userId: targetUserId };
  }

  async reinstateUser(_actorId: string, targetUserId: string) {
    const target = await this.usersService.findById(targetUserId);
    if (!target) throw new NotFoundException('User not found');
    target.accountStatus = 'active';
    target.suspensionReason = undefined;
    target.suspendedAt = undefined;
    target.bannedAt = undefined;
    await target.save();
    return { message: 'User reinstated', userId: targetUserId };
  }

  async updateUserRole(_actorId: string, targetUserId: string, role: 'user' | 'admin') {
    const target = await this.usersService.findById(targetUserId);
    if (!target) throw new NotFoundException('User not found');
    if (role !== 'user' && role !== 'admin') {
      throw new BadRequestException('Invalid role');
    }
    target.role = role;
    await target.save();
    return { message: 'Role updated', userId: targetUserId, role };
  }

  async listUsers(query: {
    search?: string;
    role?: string;
    accountType?: string;
    status?: string;
    isVerified?: boolean;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.search?.trim()) {
      const rx = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ fullName: rx }, { email: rx }];
    }
    if (query.role === 'user') {
      filter.role = 'user';
    } else if (query.role === 'admin') {
      filter.role = { $in: ['admin', 'superadmin'] };
    }
    if (query.accountType) {
      filter.accountType = query.accountType;
    }
    if (query.status) {
      filter.accountStatus = query.status;
    }
    if (query.isVerified === true) {
      filter.isEmailVerified = true;
    } else if (query.isVerified === false) {
      filter.isEmailVerified = false;
    }
    if (query.dateFrom || query.dateTo) {
      filter.createdAt = {} as Record<string, Date>;
      if (query.dateFrom) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        (filter.createdAt as Record<string, Date>).$lte = new Date(query.dateTo);
      }
    }

    const [rows, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          'fullName email phoneNumber role accountType isEmailVerified isPhoneVerified isIdVerified rating reviewCount accountStatus createdAt',
        )
        .lean()
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const data = rows.map((u) => ({
      id: String(u._id),
      fullName: u.fullName,
      email: u.email,
      phoneNumber: u.phoneNumber,
      role: u.role ?? 'user',
      accountType: u.accountType ?? null,
      isEmailVerified: !!u.isEmailVerified,
      isPhoneVerified: !!u.isPhoneVerified,
      isIdVerified: !!u.isIdVerified,
      rating: Number(u.rating ?? 0),
      reviewCount: Number(u.reviewCount ?? 0),
      accountStatus: u.accountStatus ?? 'active',
      createdAt: (u as { createdAt?: Date }).createdAt,
    }));

    return { data, total, page, limit };
  }

  private serializeUserDetail(user: UserDocument): Record<string, unknown> {
    const o = user.toObject() as unknown as Record<string, unknown>;
    delete o.passwordHash;
    delete o.refreshTokenHash;
    delete o.otpCode;
    delete o.otpExpiry;
    o._id = user._id;
    return o;
  }

  async getUserDetail(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const [
      stats,
      recentBookings,
      recentTrips,
      recentRequests,
    ] = await Promise.all([
      this.usersService.getStats(userId),
      this.bookingModel
        .find({
          $or: [
            { requesterId: user._id },
            { travelerId: user._id },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id status createdAt')
        .lean()
        .exec(),
      this.tripModel
        .find({ travelerId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id status createdAt')
        .lean()
        .exec(),
      this.requestModel
        .find({ requesterId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id status createdAt')
        .lean()
        .exec(),
    ]);

    return {
      user: this.serializeUserDetail(user),
      stats,
      recentActivity: {
        bookings: recentBookings.map((b) => ({
          id: String(b._id),
          status: b.status,
          createdAt: (b as { createdAt?: Date }).createdAt,
        })),
        trips: recentTrips.map((t) => ({
          id: String(t._id),
          status: t.status,
          createdAt: (t as { createdAt?: Date }).createdAt,
        })),
        requests: recentRequests.map((r) => ({
          id: String(r._id),
          status: r.status,
          createdAt: (r as { createdAt?: Date }).createdAt,
        })),
      },
    };
  }

  async listTrips(query: {
    status?: string;
    origin?: string;
    destination?: string;
    dateFrom?: string;
    dateTo?: string;
    travelerId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.origin?.trim()) {
      filter.origin = new RegExp(query.origin.trim(), 'i');
    }
    if (query.destination?.trim()) {
      filter.destination = new RegExp(query.destination.trim(), 'i');
    }
    if (query.travelerId && Types.ObjectId.isValid(query.travelerId)) {
      filter.travelerId = new Types.ObjectId(query.travelerId);
    }
    if (query.dateFrom || query.dateTo) {
      filter.createdAt = {} as Record<string, Date>;
      if (query.dateFrom)
        (filter.createdAt as Record<string, Date>).$gte = new Date(query.dateFrom);
      if (query.dateTo)
        (filter.createdAt as Record<string, Date>).$lte = new Date(query.dateTo);
    }

    const [data, total] = await Promise.all([
      this.tripModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('travelerId', 'fullName email profilePhoto')
        .exec(),
      this.tripModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async listRequests(query: {
    status?: string;
    type?: string;
    urgencyLevel?: string;
    origin?: string;
    destination?: string;
    requesterId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;
    if (query.urgencyLevel) filter.urgencyLevel = query.urgencyLevel;
    if (query.origin?.trim()) filter.origin = new RegExp(query.origin.trim(), 'i');
    if (query.destination?.trim()) {
      filter.destination = new RegExp(query.destination.trim(), 'i');
    }
    if (query.requesterId && Types.ObjectId.isValid(query.requesterId)) {
      filter.requesterId = new Types.ObjectId(query.requesterId);
    }

    const [data, total] = await Promise.all([
      this.requestModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('requesterId', 'fullName email profilePhoto')
        .exec(),
      this.requestModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async listBookings(query: {
    status?: string;
    travelerId?: string;
    requesterId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.travelerId && Types.ObjectId.isValid(query.travelerId)) {
      filter.travelerId = new Types.ObjectId(query.travelerId);
    }
    if (query.requesterId && Types.ObjectId.isValid(query.requesterId)) {
      filter.requesterId = new Types.ObjectId(query.requesterId);
    }
    if (query.dateFrom || query.dateTo) {
      filter.createdAt = {} as Record<string, Date>;
      if (query.dateFrom)
        (filter.createdAt as Record<string, Date>).$gte = new Date(query.dateFrom);
      if (query.dateTo)
        (filter.createdAt as Record<string, Date>).$lte = new Date(query.dateTo);
    }

    const [data, total] = await Promise.all([
      this.bookingModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('requesterId', 'fullName email profilePhoto')
        .populate('travelerId', 'fullName email profilePhoto')
        .exec(),
      this.bookingModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async listDisputes(query: {
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = { status: 'disputed' };
    if (query.dateFrom || query.dateTo) {
      filter.disputeRaisedAt = {} as Record<string, Date>;
      if (query.dateFrom) {
        (filter.disputeRaisedAt as Record<string, Date>).$gte = new Date(
          query.dateFrom,
        );
      }
      if (query.dateTo) {
        (filter.disputeRaisedAt as Record<string, Date>).$lte = new Date(
          query.dateTo,
        );
      }
    }

    const [data, total] = await Promise.all([
      this.bookingModel
        .find(filter)
        .sort({ disputeRaisedAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate('requesterId', 'fullName email profilePhoto')
        .populate('travelerId', 'fullName email profilePhoto')
        .populate('requestId')
        .populate('tripId')
        .exec(),
      this.bookingModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async resolveDispute(
    adminUserId: string,
    bookingId: string,
    dto: ResolveDisputeDto,
  ) {
    if (dto.resolution === 'partial_refund') {
      if (dto.refundAmount === undefined || dto.refundAmount === null) {
        throw new BadRequestException(
          'refundAmount is required for partial_refund',
        );
      }
    }

    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'disputed') {
      throw new BadRequestException('Booking is not in disputed status');
    }

    booking.disputeResolution = dto.notes;
    booking.disputeResolvedAt = new Date();
    booking.disputeResolvedBy = new Types.ObjectId(adminUserId);

    switch (dto.resolution) {
      case 'refund_requester': {
        const amt =
          dto.refundAmount ??
          booking.agreedFee ??
          booking.counterFee ??
          booking.offeredFee;
        booking.refundAmount = amt;
        booking.status = 'cancelled';
        break;
      }
      case 'partial_refund': {
        booking.refundAmount = dto.refundAmount!;
        booking.status = 'cancelled';
        break;
      }
      case 'release_traveler': {
        booking.status = 'completed';
        booking.completedAt = booking.completedAt ?? new Date();
        break;
      }
      case 'no_action': {
        booking.status = 'completed';
        booking.completedAt = booking.completedAt ?? new Date();
        break;
      }
      default:
        throw new BadRequestException('Invalid resolution');
    }

    if (
      (dto.resolution === 'partial_refund' ||
        dto.resolution === 'refund_requester') &&
      booking.paymentIntentId
    ) {
      let refundDollars: number | undefined;
      if (dto.resolution === 'partial_refund') {
        refundDollars = dto.refundAmount!;
      } else if (
        dto.refundAmount !== undefined &&
        dto.refundAmount !== null
      ) {
        refundDollars = dto.refundAmount;
      }
      try {
        await this.paymentsService.refundPayment({
          paymentIntentId: booking.paymentIntentId,
          amount: refundDollars,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new BadRequestException(`Stripe refund failed: ${msg}`);
      }
    } else if (
      (dto.resolution === 'partial_refund' ||
        dto.resolution === 'refund_requester') &&
      !booking.paymentIntentId
    ) {
      this.logger.warn(
        `Dispute ${bookingId} resolved with refund but no paymentIntentId; skipping Stripe`,
      );
    }

    await booking.save();
    return { message: 'Dispute resolved', booking };
  }

  async listSupportRequests(query: {
    adminApprovalStatus?: string;
    urgencyLevel?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = { type: 'support' };
    if (query.adminApprovalStatus) {
      filter.adminApprovalStatus = query.adminApprovalStatus;
    }
    if (query.urgencyLevel) filter.urgencyLevel = query.urgencyLevel;
    if (query.status) filter.status = query.status;

    const urgencyRank = {
      $switch: {
        branches: [
          { case: { $eq: ['$urgencyLevel', 'critical'] }, then: 4 },
          { case: { $eq: ['$urgencyLevel', 'high'] }, then: 3 },
          { case: { $eq: ['$urgencyLevel', 'medium'] }, then: 2 },
          { case: { $eq: ['$urgencyLevel', 'low'] }, then: 1 },
        ],
        default: 0,
      },
    };

    const usersColl = this.userModel.collection.name;
    const pipeline: PipelineStage[] = [
      { $match: filter },
      { $addFields: { _urgencyRank: urgencyRank } },
      { $sort: { _urgencyRank: -1, createdAt: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: usersColl,
          localField: 'requesterId',
          foreignField: '_id',
          as: 'requesterId',
        },
      },
      {
        $unwind: {
          path: '$requesterId',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    const [data, total] = await Promise.all([
      this.requestModel.aggregate(pipeline).exec(),
      this.requestModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async approveSupportRequest(
    adminUserId: string,
    requestId: string,
    notes?: string,
  ) {
    const doc = await this.requestModel.findById(requestId).exec();
    if (!doc) throw new NotFoundException('Request not found');
    if (doc.type !== 'support') {
      throw new BadRequestException('Not a support request');
    }
    doc.adminApprovalStatus = 'approved';
    doc.adminApprovalNotes = notes?.trim();
    doc.adminReviewedBy = new Types.ObjectId(adminUserId);
    doc.adminReviewedAt = new Date();
    await doc.save();

    await this.notificationsService.createNotification({
      userId: doc.requesterId,
      type: 'support_request_approved',
      title: 'Your support request was approved',
      body:
        'Your community support request has been approved and is now visible to travelers.',
      metadata: { requestId },
    });

    return { message: 'Request approved', request: doc };
  }

  async rejectSupportRequest(
    adminUserId: string,
    requestId: string,
    notes: string,
  ) {
    const doc = await this.requestModel.findById(requestId).exec();
    if (!doc) throw new NotFoundException('Request not found');
    if (doc.type !== 'support') {
      throw new BadRequestException('Not a support request');
    }
    doc.adminApprovalStatus = 'rejected';
    doc.adminApprovalNotes = notes.trim();
    doc.adminReviewedBy = new Types.ObjectId(adminUserId);
    doc.adminReviewedAt = new Date();
    doc.status = 'cancelled';
    await doc.save();

    return { message: 'Request rejected', request: doc };
  }

  private impactDateFilter(
    dateFrom?: string,
    dateTo?: string,
  ): Record<string, unknown> | undefined {
    if (!dateFrom && !dateTo) return undefined;
    const q: Record<string, unknown> = {};
    if (dateFrom) q.$gte = new Date(dateFrom);
    if (dateTo) q.$lte = new Date(dateTo);
    return { createdAt: q };
  }

  /** After $lookup request as `rq`, filter support request createdAt range. */
  private rqCreatedRangeStage(
    dateFrom?: string,
    dateTo?: string,
  ): PipelineStage | null {
    if (!dateFrom && !dateTo) return null;
    const q: Record<string, Date> = {};
    if (dateFrom) q.$gte = new Date(dateFrom);
    if (dateTo) q.$lte = new Date(dateTo);
    return { $match: { 'rq.createdAt': q } };
  }

  async getImpact(query: { dateFrom?: string; dateTo?: string }) {
    const rf = this.impactDateFilter(query.dateFrom, query.dateTo);
    const reqMatch: Record<string, unknown> = { type: 'support' };
    if (rf) Object.assign(reqMatch, rf);

    const rqDate = this.rqCreatedRangeStage(query.dateFrom, query.dateTo);

    const [
      supportRequestsTotal,
      supportRequestsFulfilled,
      volunteerDeliveriesAgg,
      elderlyAssisted,
      communityChampionsAgg,
      byType,
      byPaymentType,
      topTravelersAgg,
    ] = await Promise.all([
      this.requestModel.countDocuments(reqMatch).exec(),
      this.requestModel
        .countDocuments({
          ...reqMatch,
          status: 'completed',
        })
        .exec(),
      this.bookingModel
        .aggregate<{ n: number }>([
          { $match: { status: 'completed' } },
          {
            $lookup: {
              from: this.requestCollection(),
              localField: 'requestId',
              foreignField: '_id',
              as: 'rq',
            },
          },
          { $unwind: '$rq' },
          ...(rqDate ? [rqDate] : []),
          {
            $match: {
              'rq.paymentType': 'volunteer',
              'rq.type': 'support',
            },
          },
          { $count: 'n' },
        ])
        .exec(),
      this.requestModel
        .countDocuments({
          ...reqMatch,
          beneficiaryType: 'elderly',
          status: 'completed',
        })
        .exec(),
      this.bookingModel
        .aggregate<{ n: number }>([
          { $match: { status: 'completed' } },
          {
            $lookup: {
              from: this.requestCollection(),
              localField: 'requestId',
              foreignField: '_id',
              as: 'rq',
            },
          },
          { $unwind: '$rq' },
          ...(rqDate ? [rqDate] : []),
          { $match: { 'rq.type': 'support' } },
          { $group: { _id: '$travelerId', c: { $sum: 1 } } },
          { $match: { c: { $gte: 5 } } },
          { $count: 'n' },
        ])
        .exec(),
      this.requestModel
        .aggregate<{ type: string; count: number; fulfilled: number }>([
          { $match: reqMatch },
          {
            $group: {
              _id: '$beneficiaryType',
              count: { $sum: 1 },
              fulfilled: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
              },
            },
          },
          {
            $project: {
              _id: 0,
              type: { $ifNull: ['$_id', 'unknown'] },
              count: 1,
              fulfilled: 1,
            },
          },
        ])
        .exec(),
      this.requestModel
        .aggregate<{ paymentType: string; count: number }>([
          { $match: { ...reqMatch, paymentType: { $exists: true } } },
          {
            $group: {
              _id: '$paymentType',
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              paymentType: '$_id',
              count: 1,
            },
          },
        ])
        .exec(),
      this.bookingModel
        .aggregate<{
          _id: Types.ObjectId;
          supportDeliveries: number;
        }>([
          { $match: { status: 'completed' } },
          {
            $lookup: {
              from: this.requestCollection(),
              localField: 'requestId',
              foreignField: '_id',
              as: 'rq',
            },
          },
          { $unwind: '$rq' },
          ...(rqDate ? [rqDate] : []),
          { $match: { 'rq.type': 'support' } },
          {
            $group: {
              _id: '$travelerId',
              supportDeliveries: { $sum: 1 },
            },
          },
          { $sort: { supportDeliveries: -1 } },
          { $limit: 10 },
        ])
        .exec(),
    ]);

    const travelerIds = topTravelersAgg.map((t) => t._id);
    const profiles =
      travelerIds.length > 0
        ? await this.userModel
            .find({ _id: { $in: travelerIds } })
            .select('fullName profilePhoto')
            .lean()
            .exec()
        : [];
    const profileMap = new Map(
      profiles.map((p) => [String(p._id), p] as const),
    );

    const topTravelers = topTravelersAgg.map((t) => {
      const p = profileMap.get(String(t._id));
      return {
        travelerId: String(t._id),
        fullName: p?.fullName ?? '',
        profilePhoto: p?.profilePhoto ?? null,
        supportDeliveries: t.supportDeliveries,
      };
    });

    return {
      overview: {
        supportRequestsTotal,
        supportRequestsFulfilled,
        volunteerDeliveries: volunteerDeliveriesAgg[0]?.n ?? 0,
        elderlyAssisted,
        communityChampions: communityChampionsAgg[0]?.n ?? 0,
      },
      byType: byType.map((b) => ({
        type: String(b.type),
        count: b.count,
        fulfilled: b.fulfilled,
      })),
      byPaymentType: byPaymentType.map((b) => ({
        paymentType: String(b.paymentType),
        count: b.count,
      })),
      topTravelers,
    };
  }

  async listReferrals(query: { page?: number; limit?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;
    const filter = {
      referredBy: { $exists: true, $ne: null },
    };

    const [rows, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('referredBy', 'fullName email')
        .lean()
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const data = rows.map((u) => ({
      id: String(u._id),
      fullName: u.fullName,
      email: u.email,
      loyaltyPoints: (u as { loyaltyPoints?: number }).loyaltyPoints ?? 0,
      createdAt: (u as { createdAt?: Date }).createdAt,
      referredBy: u.referredBy,
    }));

    return { data, total, page, limit };
  }

  async getLoyaltyOverview() {
    const [tierRows, topUsers] = await Promise.all([
      this.userModel
        .aggregate<{ _id: string; count: number }>([
          {
            $group: {
              _id: { $ifNull: ['$loyaltyTier', 'bronze'] },
              count: { $sum: 1 },
            },
          },
        ])
        .exec(),
      this.userModel
        .find()
        .sort({ loyaltyPoints: -1 })
        .limit(10)
        .select('fullName email loyaltyPoints')
        .lean()
        .exec(),
    ]);

    const tierMap = new Map(
      tierRows.map((r) => [r._id, r.count] as const),
    );
    const tiers = ['bronze', 'silver', 'gold'].map((tier) => ({
      tier,
      count: tierMap.get(tier) ?? 0,
    }));

    return {
      tiers,
      topUsers: topUsers.map((u) => ({
        fullName: u.fullName,
        email: u.email,
        points: u.loyaltyPoints ?? 0,
      })),
    };
  }
}
