import { IsNotEmpty, IsString } from 'class-validator';

export class DisputeDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
