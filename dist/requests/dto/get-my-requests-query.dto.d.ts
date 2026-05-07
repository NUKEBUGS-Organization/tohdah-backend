import { REQUEST_STATUSES, REQUEST_TYPES } from '../schemas/request.schema';
export declare class GetMyRequestsQueryDto {
    status?: (typeof REQUEST_STATUSES)[number];
    type?: (typeof REQUEST_TYPES)[number];
}
