import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly logger;
    client: Redis;
    constructor(config: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private refreshKey;
    private refreshPattern;
    private ttlSeconds;
    setRefreshToken(userId: string, tokenId: string, hash: string, ttlSeconds?: number): Promise<void>;
    getRefreshToken(userId: string, tokenId: string): Promise<string | null>;
    deleteRefreshToken(userId: string, tokenId: string): Promise<void>;
    deleteAllRefreshTokens(userId: string): Promise<void>;
    countSessions(userId: string): Promise<number>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds: number): Promise<void>;
    del(key: string): Promise<void>;
    isHealthy(): Promise<boolean>;
}
