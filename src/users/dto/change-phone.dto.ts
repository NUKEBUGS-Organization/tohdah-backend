import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePhoneDto {
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  newPhoneNumber: string;

  @IsString()
  password: string;
}
