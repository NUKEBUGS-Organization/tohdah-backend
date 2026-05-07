import { BENEFICIARY_TYPES, ITEM_CATEGORIES, ITEM_SIZES, PAYMENT_TYPES, REQUEST_TYPES, URGENCY_LEVELS } from '../schemas/request.schema';
export declare class CreateRequestDto {
    type: (typeof REQUEST_TYPES)[number];
    itemName: string;
    itemDescription: string;
    itemCategory: (typeof ITEM_CATEGORIES)[number];
    itemSize: (typeof ITEM_SIZES)[number];
    estimatedValue?: number;
    origin: string;
    destination: string;
    deliveryDeadline: string;
    budget?: number;
    currency?: string;
    paymentType?: (typeof PAYMENT_TYPES)[number];
    beneficiaryName?: string;
    beneficiaryType?: (typeof BENEFICIARY_TYPES)[number];
    urgencyLevel?: (typeof URGENCY_LEVELS)[number];
    supportingNotes?: string;
}
