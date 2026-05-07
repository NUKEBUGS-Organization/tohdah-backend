export declare class CategoryRatingsDto {
    communication?: number;
    reliability?: number;
    itemCare?: number;
    punctuality?: number;
}
export declare class CreateReviewDto {
    bookingId: string;
    revieweeId: string;
    overallRating: number;
    categoryRatings?: CategoryRatingsDto;
    comment?: string;
}
