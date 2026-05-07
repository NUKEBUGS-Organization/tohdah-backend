import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsListQueryDto } from './dto/reviews-list-query.dto';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.userId, dto);
  }

  @Get('my')
  getMy(
    @CurrentUser() user: RequestUser,
    @Query() query: ReviewsListQueryDto,
  ) {
    return this.reviewsService.getMyReviews(
      user.userId,
      query.page,
      query.limit,
    );
  }

  @Get('user/:userId')
  getForUser(
    @Param('userId') userId: string,
    @Query() query: ReviewsListQueryDto,
  ) {
    return this.reviewsService.getReviewsForUser(
      userId,
      query.page,
      query.limit,
    );
  }

  @Get('booking/:bookingId')
  getForBooking(
    @CurrentUser() user: RequestUser,
    @Param('bookingId') bookingId: string,
  ) {
    return this.reviewsService.getReviewsForBooking(bookingId, user.userId);
  }
}
