import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { TrustService } from './trust.service';
import { VerifyFieldDto } from './dto/verify-field.dto';
export declare class TrustController {
    private readonly trustService;
    constructor(trustService: TrustService);
    getMine(user: RequestUser): Promise<import("./trust.types").TrustResult>;
    getUser(userId: string): Promise<import("./trust.types").TrustResult>;
    badges(userId: string): Promise<{
        badge: string;
        earned: boolean;
    }[]>;
    verifyStub(user: RequestUser, dto: VerifyFieldDto): Promise<import("./trust.types").TrustResult>;
}
