import { ConfigService } from '@nestjs/config';
export declare class FcmService {
    private readonly config;
    private readonly logger;
    private app?;
    constructor(config: ConfigService);
    sendToDevice(params: {
        token: string;
        title: string;
        body: string;
        data?: Record<string, string>;
        imageUrl?: string;
    }): Promise<boolean>;
    sendToMultiple(params: {
        tokens: string[];
        title: string;
        body: string;
        data?: Record<string, string>;
    }): Promise<{
        successCount: number;
        failedTokens: string[];
    }>;
    sendToTopic(params: {
        topic: string;
        title: string;
        body: string;
        data?: Record<string, string>;
    }): Promise<boolean>;
    isAvailable(): boolean;
}
