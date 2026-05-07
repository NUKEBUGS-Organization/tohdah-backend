declare const ACCOUNT_TYPES: readonly ["traveler", "requester", "both"];
export declare class RegisterDto {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    accountType?: (typeof ACCOUNT_TYPES)[number];
}
export {};
