import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class CounterOfferDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'counterFee must be greater than 0' })
  counterFee: number;
}
