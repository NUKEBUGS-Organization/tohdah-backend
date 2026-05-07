import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  BENEFICIARY_TYPES,
  ITEM_CATEGORIES,
  ITEM_SIZES,
  PAYMENT_TYPES,
  REQUEST_TYPES,
  URGENCY_LEVELS,
} from '../schemas/request.schema';

export class CreateRequestDto {
  @IsIn([...REQUEST_TYPES])
  type: (typeof REQUEST_TYPES)[number];

  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsString()
  @IsNotEmpty()
  itemDescription: string;

  @IsIn([...ITEM_CATEGORIES])
  itemCategory: (typeof ITEM_CATEGORIES)[number];

  @IsIn([...ITEM_SIZES])
  itemSize: (typeof ITEM_SIZES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  estimatedValue?: number;

  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsDateString()
  deliveryDeadline: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsIn([...PAYMENT_TYPES])
  paymentType?: (typeof PAYMENT_TYPES)[number];

  @IsOptional()
  @IsString()
  beneficiaryName?: string;

  @IsOptional()
  @IsIn([...BENEFICIARY_TYPES])
  beneficiaryType?: (typeof BENEFICIARY_TYPES)[number];

  @IsOptional()
  @IsIn([...URGENCY_LEVELS])
  urgencyLevel?: (typeof URGENCY_LEVELS)[number];

  @IsOptional()
  @IsString()
  supportingNotes?: string;
}
