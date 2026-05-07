"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
let OnboardingService = class OnboardingService {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async completeStep(userId, dto) {
        const user = await this.usersService.requireUser(userId);
        if (user.onboardingCompleted) {
            throw new common_1.BadRequestException('Onboarding already completed');
        }
        const stepNext = Number(user.onboardingStep ?? 0) + 1;
        if (dto.step !== stepNext) {
            throw new common_1.BadRequestException('Complete previous steps first');
        }
        if (dto.step === 3 && !dto.accountType) {
            throw new common_1.BadRequestException('accountType is required for step 3');
        }
        switch (dto.step) {
            case 1:
                user.onboardingStep = 1;
                break;
            case 2:
                user.onboardingStep = 2;
                break;
            case 3:
                user.accountType = dto.accountType;
                user.onboardingStep = 3;
                break;
            case 4:
                if (dto.fullName !== undefined)
                    user.fullName = dto.fullName.trim();
                if (dto.profilePhoto !== undefined) {
                    user.profilePhoto = dto.profilePhoto?.trim();
                }
                if (dto.bio !== undefined)
                    user.bio = dto.bio?.trim();
                if (dto.location !== undefined)
                    user.location = dto.location?.trim();
                if (dto.languages !== undefined)
                    user.languages = dto.languages;
                if (dto.travelPreferences !== undefined) {
                    user.travelPreferences = dto.travelPreferences;
                }
                user.onboardingStep = 4;
                user.onboardingCompleted = true;
                break;
            default:
                throw new common_1.BadRequestException('Complete previous steps first');
        }
        await user.save();
        const profile = this.usersService.serializeMe(user);
        return {
            message: 'Step completed',
            user: profile,
            onboardingCompleted: !!profile.onboardingCompleted,
        };
    }
    async getStatus(userId) {
        const user = await this.usersService.requireUser(userId);
        const step = Number(user.onboardingStep ?? 0);
        let nextStep = null;
        if (!user.onboardingCompleted) {
            nextStep = Math.min(step + 1, 4);
        }
        return {
            onboardingCompleted: !!user.onboardingCompleted,
            onboardingStep: step,
            nextStep,
            accountType: user.accountType ?? null,
        };
    }
};
exports.OnboardingService = OnboardingService;
exports.OnboardingService = OnboardingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], OnboardingService);
//# sourceMappingURL=onboarding.service.js.map