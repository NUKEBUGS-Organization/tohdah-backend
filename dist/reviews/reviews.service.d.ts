import { Model } from 'mongoose';
import { ReviewDocument } from './schemas/review.schema';
import { BookingsService } from '../bookings/bookings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { CreateReviewDto } from './dto/create-review.dto';
export declare class ReviewsService {
    private readonly reviewModel;
    private readonly bookingsService;
    private readonly notificationsService;
    private readonly usersService;
    constructor(reviewModel: Model<ReviewDocument>, bookingsService: BookingsService, notificationsService: NotificationsService, usersService: UsersService);
    private notify;
    private updateUserRating;
    create(userId: string, dto: CreateReviewDto): Promise<ReviewDocument>;
    getReviewsForUser(targetUserId: string, page?: number, limit?: number): Promise<{
        data: ReviewDocument[];
        total: number;
        page: number;
        limit: number;
        averageRating: number;
    }>;
    getReviewsForBooking(bookingId: string, userId: string): Promise<ReviewDocument[]>;
    getMyReviews(userId: string, page?: number, limit?: number): Promise<{
        data: ReviewDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
}
