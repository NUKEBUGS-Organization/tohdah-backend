import { Controller, Get } from '@nestjs/common';
import { SkipAllThrottlers } from './common/decorators/throttle.decorator';
import { RedisService } from './common/redis/redis.service';
import { TohdahGateway } from './gateway/tohdah.gateway';

@SkipAllThrottlers()
@Controller()
export class AppController {
  constructor(
    private readonly redisService: RedisService,
    private readonly gateway: TohdahGateway,
  ) {}

  @Get()
  async getHealth() {
    const redisHealthy = await this.redisService.isHealthy();
    return {
      service: 'tohdah-api',
      status: 'ok' as const,
      redis: redisHealthy ? 'connected' : 'unavailable',
      connectedUsers: this.gateway.getConnectedUserCount(),
      timestamp: new Date().toISOString(),
    };
  }
}
