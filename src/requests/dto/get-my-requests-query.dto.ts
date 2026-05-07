import { IsIn, IsOptional } from 'class-validator';
import { REQUEST_STATUSES, REQUEST_TYPES } from '../schemas/request.schema';

export class GetMyRequestsQueryDto {
  @IsOptional()
  @IsIn([...REQUEST_STATUSES])
  status?: (typeof REQUEST_STATUSES)[number];

  @IsOptional()
  @IsIn([...REQUEST_TYPES])
  type?: (typeof REQUEST_TYPES)[number];
}
