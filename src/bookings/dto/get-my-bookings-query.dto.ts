import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsNumber, IsOptional, Min } from 'class-validator';
import { BOOKING_STATUSES } from '../schemas/booking.schema';

export class GetMyBookingsQueryDto {
  @IsOptional()
  @IsIn([...BOOKING_STATUSES])
  status?: (typeof BOOKING_STATUSES)[number];

  @IsOptional()
  @IsEnum(['requester', 'traveler'] as const)
  role?: 'requester' | 'traveler';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
