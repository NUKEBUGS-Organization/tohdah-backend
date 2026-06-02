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
  ACCOUNT_STATUSES,
  ACCOUNT_TYPES,
  USER_ROLES,
} from '../../users/schemas/user.schema';

export class AdminUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn([...USER_ROLES])
  role?: (typeof USER_ROLES)[number];

  @IsOptional()
  @IsIn([...ACCOUNT_TYPES])
  accountType?: (typeof ACCOUNT_TYPES)[number];

  /** Maps to `accountStatus` on the user model. */
  @IsOptional()
  @IsIn([...ACCOUNT_STATUSES])
  status?: (typeof ACCOUNT_STATUSES)[number];

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return value;
  })
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

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
