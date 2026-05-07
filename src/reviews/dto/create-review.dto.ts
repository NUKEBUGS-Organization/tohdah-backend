import { Type } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CategoryRatingsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  communication?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  reliability?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  itemCare?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  punctuality?: number;
}

export class CreateReviewDto {
  @IsMongoId()
  @IsNotEmpty()
  bookingId: string;

  @IsMongoId()
  @IsNotEmpty()
  revieweeId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  overallRating: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CategoryRatingsDto)
  categoryRatings?: CategoryRatingsDto;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
