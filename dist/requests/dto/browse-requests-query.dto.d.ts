import { ITEM_CATEGORIES, ITEM_SIZES, REQUEST_TYPES, URGENCY_LEVELS } from '../schemas/request.schema';
export declare class BrowseRequestsQueryDto {
    origin?: string;
    destination?: string;
    type?: (typeof REQUEST_TYPES)[number];
    itemCategory?: (typeof ITEM_CATEGORIES)[number];
    itemSize?: (typeof ITEM_SIZES)[number];
    urgencyLevel?: (typeof URGENCY_LEVELS)[number];
    minBudget?: number;
    maxBudget?: number;
    supportOnly?: boolean;
    deadlineBefore?: string;
    page?: number;
    limit?: number;
}
