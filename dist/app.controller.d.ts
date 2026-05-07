import { RedisService } from './common/redis/redis.service';
export declare class AppController {
    private readonly redisService;
    constructor(redisService: RedisService);
    getHealth(): Promise<{
        service: string;
        status: "ok";
        redis: string;
        timestamp: string;
    }>;
}
