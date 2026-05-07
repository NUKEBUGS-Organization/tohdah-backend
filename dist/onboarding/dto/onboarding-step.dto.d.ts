import type { AccountType } from '../../users/schemas/user.schema';
export declare class OnboardingStepDto {
    step: number;
    accountType?: AccountType;
    fullName?: string;
    bio?: string;
    location?: string;
    profilePhoto?: string;
    languages?: string[];
    travelPreferences?: string[];
}
