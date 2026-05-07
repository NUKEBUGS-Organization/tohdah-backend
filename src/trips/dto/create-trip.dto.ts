import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { LUGGAGE_SPACES, PRICING_TYPES } from '../schemas/trip.schema';

export class CreateTripDto {
  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsDateString()
  departureDate: string;

  @IsDateString()
  arrivalDate: string;

  @IsIn([...LUGGAGE_SPACES])
  luggageSpace: (typeof LUGGAGE_SPACES)[number];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  acceptedCategories?: string[];

  @IsOptional()
  @IsString()
  deliveryPreferences?: string;

  @IsIn([...PRICING_TYPES])
  pricingType: (typeof PRICING_TYPES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pricePerKg?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  openToCommunitySupport?: boolean;

  @IsOptional()
  @IsBoolean()
  willingToAssistElderly?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptReducedFee?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptVolunteer?: boolean;
}
