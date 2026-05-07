import { IsNotEmpty, IsString } from 'class-validator';

export class ProofOfDeliveryDto {
  @IsString()
  @IsNotEmpty()
  podPhotoUrl: string;

  @IsString()
  @IsNotEmpty()
  podConfirmationCode: string;
}
