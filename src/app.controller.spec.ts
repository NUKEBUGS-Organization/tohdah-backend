import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { RedisService } from './common/redis/redis.service';
import { TohdahGateway } from './gateway/tohdah.gateway';

describe('AppController', () => {
  let appController: AppController;
  let redis: { isHealthy: jest.Mock };
  let gateway: { getConnectedUserCount: jest.Mock };

  beforeEach(async () => {
    redis = { isHealthy: jest.fn().mockResolvedValue(true) };
    gateway = { getConnectedUserCount: jest.fn().mockReturnValue(3) };
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: RedisService, useValue: redis },
        { provide: TohdahGateway, useValue: gateway },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return health payload with redis status', async () => {
      const res = await appController.getHealth();
      expect(res.service).toBe('tohdah-api');
      expect(res.status).toBe('ok');
      expect(res.redis).toBe('connected');
      expect(res.connectedUsers).toBe(3);
      expect(typeof res.timestamp).toBe('string');
    });
  });
});
