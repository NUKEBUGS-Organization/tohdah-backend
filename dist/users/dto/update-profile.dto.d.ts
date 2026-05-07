import type { AccountType } from '../schemas/user.schema';
export declare class UpdateProfileDto {
    fullName?: string;
    bio?: string;
    location?: string;
    languages?: string[];
    travelPreferences?: string[];
    profilePhoto?: string;
    accountType?: AccountType;
}
