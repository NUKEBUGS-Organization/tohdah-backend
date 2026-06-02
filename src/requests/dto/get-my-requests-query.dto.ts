import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, Min } from 'class-validator';
import { REQUEST_STATUSES, REQUEST_TYPES } from '../schemas/request.schema';

export class GetMyRequestsQueryDto {
  @IsOptional()
  @IsIn([...REQUEST_STATUSES])
  status?: (typeof REQUEST_STATUSES)[number];

  @IsOptional()
  @IsIn([...REQUEST_TYPES])
  type?: (typeof REQUEST_TYPES)[number];

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
