import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  ITEM_CATEGORIES,
  ITEM_SIZES,
  REQUEST_TYPES,
  URGENCY_LEVELS,
} from '../schemas/request.schema';

export class BrowseRequestsQueryDto {
  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsIn([...REQUEST_TYPES])
  type?: (typeof REQUEST_TYPES)[number];

  @IsOptional()
  @IsIn([...ITEM_CATEGORIES])
  itemCategory?: (typeof ITEM_CATEGORIES)[number];

  @IsOptional()
  @IsIn([...ITEM_SIZES])
  itemSize?: (typeof ITEM_SIZES)[number];

  @IsOptional()
  @IsIn([...URGENCY_LEVELS])
  urgencyLevel?: (typeof URGENCY_LEVELS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minBudget?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxBudget?: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  supportOnly?: boolean;

  @IsOptional()
  @IsDateString()
  deadlineBefore?: string;

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
