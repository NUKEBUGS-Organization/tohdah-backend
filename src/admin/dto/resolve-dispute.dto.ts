import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export const DISPUTE_RESOLUTIONS = [
  'refund_requester',
  'release_traveler',
  'partial_refund',
  'no_action',
] as const;
export type DisputeResolution = (typeof DISPUTE_RESOLUTIONS)[number];

export class ResolveDisputeDto {
  @IsEnum(DISPUTE_RESOLUTIONS)
  resolution: DisputeResolution;

  @IsOptional()
  @IsNumber()
  refundAmount?: number;

  @IsString()
  @IsNotEmpty()
  notes: string;
}
