import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApproveSupportDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectSupportDto {
  @IsString()
  @IsNotEmpty()
  notes: string;
}
