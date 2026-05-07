export declare const DISPUTE_RESOLUTIONS: readonly ["refund_requester", "release_traveler", "partial_refund", "no_action"];
export type DisputeResolution = (typeof DISPUTE_RESOLUTIONS)[number];
export declare class ResolveDisputeDto {
    resolution: DisputeResolution;
    refundAmount?: number;
    notes: string;
}
