import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.client = new Redis(
      this.config.get<string>('REDIS_URL', 'redis://localhost:6379'),
      {
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.error('Redis connection failed after 3 retries');
            return null;
          }
          return Math.min(times * 200, 1000);
        },
        enableOfflineQueue: false,
      },
    );

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err: Error) =>
      this.logger.error(`Redis error: ${err.message}`),
    );
    this.client.on('close', () => this.logger.warn('Redis connection closed'));

    void this.client.connect().catch((err: Error) =>
      this.logger.error(`Redis initial connect failed: ${err.message}`),
    );
  }

  onModuleDestroy(): void {
    void this.client?.quit().catch(() => undefined);
  }

  private refreshKey(userId: string, tokenId: string): string {
    return `tohdah:refresh:${userId}:${tokenId}`;
  }

  private refreshPattern(userId: string): string {
    return `tohdah:refresh:${userId}:*`;
  }

  private ttlSeconds(override?: number): number {
    if (override !== undefined) return override;
    const raw = this.config.get<string | number>('REDIS_TTL_SECONDS', 604800);
    const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    return Number.isFinite(n) && n > 0 ? n : 604800;
  }

  async setRefreshToken(
    userId: string,
    tokenId: string,
    hash: string,
    ttlSeconds?: number,
  ): Promise<void> {
    const key = this.refreshKey(userId, tokenId);
    const ttl = this.ttlSeconds(ttlSeconds);
    await this.client.set(key, hash, 'EX', ttl);
  }

  async getRefreshToken(
    userId: string,
    tokenId: string,
  ): Promise<string | null> {
    return this.client.get(this.refreshKey(userId, tokenId));
  }

  async deleteRefreshToken(userId: string, tokenId: string): Promise<void> {
    await this.client.del(this.refreshKey(userId, tokenId));
  }

  async deleteAllRefreshTokens(userId: string): Promise<void> {
    const pattern = this.refreshPattern(userId);
    const keys = await this.client.keys(pattern);
    if (keys.length) {
      await this.client.del(...keys);
    }
  }

  async countSessions(userId: string): Promise<number> {
    const keys = await this.client.keys(this.refreshPattern(userId));
    return keys.length;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}
