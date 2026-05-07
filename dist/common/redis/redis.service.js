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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    config;
    logger = new common_1.Logger(RedisService_1.name);
    client;
    constructor(config) {
        this.config = config;
    }
    onModuleInit() {
        this.client = new ioredis_1.default(this.config.get('REDIS_URL', 'redis://localhost:6379'), {
            lazyConnect: true,
            retryStrategy: (times) => {
                if (times > 3) {
                    this.logger.error('Redis connection failed after 3 retries');
                    return null;
                }
                return Math.min(times * 200, 1000);
            },
            enableOfflineQueue: false,
        });
        this.client.on('connect', () => this.logger.log('Redis connected'));
        this.client.on('error', (err) => this.logger.error(`Redis error: ${err.message}`));
        this.client.on('close', () => this.logger.warn('Redis connection closed'));
        void this.client.connect().catch((err) => this.logger.error(`Redis initial connect failed: ${err.message}`));
    }
    onModuleDestroy() {
        void this.client?.quit().catch(() => undefined);
    }
    refreshKey(userId, tokenId) {
        return `tohdah:refresh:${userId}:${tokenId}`;
    }
    refreshPattern(userId) {
        return `tohdah:refresh:${userId}:*`;
    }
    ttlSeconds(override) {
        if (override !== undefined)
            return override;
        const raw = this.config.get('REDIS_TTL_SECONDS', 604800);
        const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
        return Number.isFinite(n) && n > 0 ? n : 604800;
    }
    async setRefreshToken(userId, tokenId, hash, ttlSeconds) {
        const key = this.refreshKey(userId, tokenId);
        const ttl = this.ttlSeconds(ttlSeconds);
        await this.client.set(key, hash, 'EX', ttl);
    }
    async getRefreshToken(userId, tokenId) {
        return this.client.get(this.refreshKey(userId, tokenId));
    }
    async deleteRefreshToken(userId, tokenId) {
        await this.client.del(this.refreshKey(userId, tokenId));
    }
    async deleteAllRefreshTokens(userId) {
        const pattern = this.refreshPattern(userId);
        const keys = await this.client.keys(pattern);
        if (keys.length) {
            await this.client.del(...keys);
        }
    }
    async countSessions(userId) {
        const keys = await this.client.keys(this.refreshPattern(userId));
        return keys.length;
    }
    async get(key) {
        return this.client.get(key);
    }
    async set(key, value, ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
    }
    async del(key) {
        await this.client.del(key);
    }
    async isHealthy() {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch {
            return false;
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map