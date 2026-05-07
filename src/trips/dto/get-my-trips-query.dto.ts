import { IsIn, IsOptional } from 'class-validator';
import { TRIP_STATUSES } from '../schemas/trip.schema';

export class GetMyTripsQueryDto {
  @IsOptional()
  @IsIn([...TRIP_STATUSES])
  status?: (typeof TRIP_STATUSES)[number];
}
