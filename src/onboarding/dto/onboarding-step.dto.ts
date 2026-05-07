import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ACCOUNT_TYPES } from '../../users/schemas/user.schema';
import type { AccountType } from '../../users/schemas/user.schema';

export class OnboardingStepDto {
  @IsInt()
  @Min(1)
  @Max(4)
  @IsNotEmpty()
  step: number;

  @IsOptional()
  @IsIn([...ACCOUNT_TYPES])
  accountType?: AccountType;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  travelPreferences?: string[];
}
