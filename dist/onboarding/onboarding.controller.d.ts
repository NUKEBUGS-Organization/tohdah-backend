import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { OnboardingService } from './onboarding.service';
import { OnboardingStepDto } from './dto/onboarding-step.dto';
export declare class OnboardingController {
    private readonly onboardingService;
    constructor(onboardingService: OnboardingService);
    completeStep(user: RequestUser, dto: OnboardingStepDto): Promise<{
        message: string;
        user: import("../users/users.service").MeProfileResponse;
        onboardingCompleted: boolean;
    }>;
    status(user: RequestUser): Promise<{
        onboardingCompleted: boolean;
        onboardingStep: number;
        nextStep: number | null;
        accountType: string | null;
    }>;
}
