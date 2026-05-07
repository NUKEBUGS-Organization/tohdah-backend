export type TrustLine = {
    earned: boolean;
    points: number;
};
export type TrustBreakdown = {
    emailVerified: TrustLine;
    phoneVerified: TrustLine;
    idVerified: TrustLine;
    selfieVerified: TrustLine;
    profileComplete: TrustLine;
    ratingScore: {
        points: number;
    };
    completedBookings: {
        count: number;
        points: number;
    };
    supportDeliveries: {
        count: number;
        points: number;
    };
};
export type TrustResult = {
    score: number;
    breakdown: TrustBreakdown;
};
