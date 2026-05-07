import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { ACCOUNT_TYPES } from '../schemas/user.schema';
import type { AccountType } from '../schemas/user.schema';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  location?: string;

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

  @IsOptional()
  @IsUrl()
  profilePhoto?: string;

  @IsOptional()
  @IsIn([...ACCOUNT_TYPES])
  accountType?: AccountType;
}
