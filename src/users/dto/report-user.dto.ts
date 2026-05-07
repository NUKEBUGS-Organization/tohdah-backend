import { IsIn, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { REPORT_REASONS } from '../schemas/user-report.schema';

export class ReportUserDto {
  @IsMongoId()
  targetUserId: string;

  @IsIn([...REPORT_REASONS])
  reason: (typeof REPORT_REASONS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
