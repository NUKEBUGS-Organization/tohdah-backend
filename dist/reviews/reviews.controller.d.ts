import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsListQueryDto } from './dto/reviews-list-query.dto';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    create(user: RequestUser, dto: CreateReviewDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/review.schema").Review, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/review.schema").Review & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    getMy(user: RequestUser, query: ReviewsListQueryDto): Promise<{
        data: import("./schemas/review.schema").ReviewDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    getForUser(userId: string, query: ReviewsListQueryDto): Promise<{
        data: import("./schemas/review.schema").ReviewDocument[];
        total: number;
        page: number;
        limit: number;
        averageRating: number;
    }>;
    getForBooking(user: RequestUser, bookingId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/review.schema").Review, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/review.schema").Review & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    })[]>;
}
