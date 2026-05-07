import { UsersService } from '../users/users.service';
import type { OnboardingStepDto } from './dto/onboarding-step.dto';
import type { MeProfileResponse } from '../users/users.service';
export declare class OnboardingService {
    private readonly usersService;
    constructor(usersService: UsersService);
    completeStep(userId: string, dto: OnboardingStepDto): Promise<{
        message: string;
        user: MeProfileResponse;
        onboardingCompleted: boolean;
    }>;
    getStatus(userId: string): Promise<{
        onboardingCompleted: boolean;
        onboardingStep: number;
        nextStep: number | null;
        accountType: string | null;
    }>;
}
