import { IsEnum, IsNotEmpty } from 'class-validator';

export class VerifyFieldDto {
  @IsEnum(['email', 'phone', 'id', 'selfie'] as const)
  @IsNotEmpty()
  field: 'email' | 'phone' | 'id' | 'selfie';
}
