import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { BookingsService } from '../bookings/bookings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { CreateReviewDto } from './dto/create-review.dto';

const REVIEWER_POPULATE = {
  path: 'reviewerId',
  select: 'fullName profilePhoto',
} as const;

const REVIEWER_REVIELEE_POPULATE = [
  REVIEWER_POPULATE,
  { path: 'revieweeId', select: 'fullName profilePhoto' },
] as const;

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    private readonly bookingsService: BookingsService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  private notify(p: Promise<unknown>): void {
    void p.catch(() => undefined);
  }

  private async updateUserRating(userId: string): Promise<void> {
    const oid = new Types.ObjectId(userId);
    const agg = await this.reviewModel
      .aggregate<{ avg: number | null; count: number }>([
        { $match: { revieweeId: oid, isVisible: true } },
        {
          $group: {
            _id: null,
            avg: { $avg: '$overallRating' },
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    const row = agg[0];
    const averageRating = row?.avg != null ? Math.round(row.avg * 100) / 100 : 0;
    const reviewCount = row?.count ?? 0;
    await this.usersService.updateRatingSummary(
      userId,
      averageRating,
      reviewCount,
    );
  }

  async create(userId: string, dto: CreateReviewDto): Promise<ReviewDocument> {
    const booking = await this.bookingsService.findOneForParty(
      dto.bookingId,
      userId,
    );

    if (booking.status !== 'completed') {
      throw new BadRequestException(
        'Reviews can only be left for completed bookings',
      );
    }

    const requesterOid = booking.requesterId.toString();
    const travelerOid = booking.travelerId.toString();
    const revieweeOid = dto.revieweeId;

    const otherParty =
      userId === requesterOid
        ? travelerOid
        : userId === travelerOid
          ? requesterOid
          : null;
    if (!otherParty || revieweeOid !== otherParty) {
      throw new BadRequestException('Invalid reviewee');
    }

    const exists = await this.reviewModel
      .exists({
        bookingId: new Types.ObjectId(dto.bookingId),
        reviewerId: new Types.ObjectId(userId),
      })
      .exec();
    if (exists) {
      throw new ConflictException('You have already reviewed this booking');
    }

    const review = await this.reviewModel.create({
      bookingId: new Types.ObjectId(dto.bookingId),
      reviewerId: new Types.ObjectId(userId),
      revieweeId: new Types.ObjectId(revieweeOid),
      overallRating: dto.overallRating,
      categoryRatings: dto.categoryRatings,
      comment: dto.comment?.trim(),
      isVisible: true,
    });

    await this.updateUserRating(revieweeOid);

    const rid = review._id.toString();
    this.notify(
      this.notificationsService.createNotification({
        userId: revieweeOid,
        type: 'review_request',
        title: 'You received a review',
        body: `Someone left you a ${dto.overallRating}-star review.`,
        metadata: { bookingId: dto.bookingId, reviewId: rid },
      }),
    );

    const populated = await review.populate(REVIEWER_POPULATE);
    return populated;
  }

  async getReviewsForUser(
    targetUserId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: ReviewDocument[];
    total: number;
    page: number;
    limit: number;
    averageRating: number;
  }> {
    const oid = new Types.ObjectId(targetUserId);
    const p = Math.max(1, page ?? 1);
    const lim = Math.min(100, Math.max(1, limit ?? 10));
    const skip = (p - 1) * lim;

    const filter = { revieweeId: oid, isVisible: true };

    const [data, total, avgAgg] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate(REVIEWER_POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .exec(),
      this.reviewModel.countDocuments(filter).exec(),
      this.reviewModel
        .aggregate<{ avg: number | null }>([
          { $match: filter },
          { $group: { _id: null, avg: { $avg: '$overallRating' } } },
        ])
        .exec(),
    ]);

    const avg = avgAgg[0]?.avg;
    const averageRating = avg != null ? Math.round(avg * 100) / 100 : 0;

    return {
      data,
      total,
      page: p,
      limit: lim,
      averageRating,
    };
  }

  async getReviewsForBooking(
    bookingId: string,
    userId: string,
  ): Promise<ReviewDocument[]> {
    await this.bookingsService.findOneForParty(bookingId, userId);
    return this.reviewModel
      .find({ bookingId: new Types.ObjectId(bookingId) })
      .populate([...REVIEWER_REVIELEE_POPULATE])
      .sort({ createdAt: 1 })
      .exec();
  }

  async getMyReviews(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: ReviewDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const p = Math.max(1, page ?? 1);
    const lim = Math.min(100, Math.max(1, limit ?? 10));
    const skip = (p - 1) * lim;
    const filter = { reviewerId: new Types.ObjectId(userId) };

    const [data, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate(REVIEWER_POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .exec(),
      this.reviewModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page: p, limit: lim };
  }
}
