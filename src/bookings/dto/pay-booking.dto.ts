import { IsNotEmpty, IsString } from 'class-validator';

export class PayBookingDto {
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}
