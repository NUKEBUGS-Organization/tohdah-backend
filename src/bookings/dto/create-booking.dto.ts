import { Type } from 'class-transformer';
import { IsMongoId, IsNumber, Min } from 'class-validator';

export class CreateBookingDto {
  @IsMongoId()
  requestId: string;

  @IsMongoId()
  tripId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'offeredFee must be greater than 0' })
  offeredFee: number;
}
