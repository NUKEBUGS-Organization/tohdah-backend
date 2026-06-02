import { IsString, MinLength } from 'class-validator';

export class ConfirmPaymentDto {
  @IsString()
  @MinLength(3)
  paymentIntentId!: string;
}
