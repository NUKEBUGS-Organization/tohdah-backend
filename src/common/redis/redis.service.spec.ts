import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let mockClient: {
    set: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
    keys: jest.Mock;
    ping: jest.Mock;
  };

  beforeEach(async () => {
    mockClient = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
      ping: jest.fn().mockResolvedValue('PONG'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: string | number) => {
              if (key === 'REDIS_TTL_SECONDS') return 604800;
              return def;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(RedisService);
    (service as unknown as { client: Redis }).client =
      mockClient as unknown as Redis;
  });

  it('setRefreshToken calls client.set with key and TTL', async () => {
    await service.setRefreshToken('u1', 't1', 'hashy');
    expect(mockClient.set).toHaveBeenCalledWith(
      'tohdah:refresh:u1:t1',
      'hashy',
      'EX',
      604800,
    );
  });

  it('getRefreshToken calls client.get with correct key', async () => {
    mockClient.get.mockResolvedValueOnce('stored');
    const v = await service.getRefreshToken('u1', 't1');
    expect(v).toBe('stored');
    expect(mockClient.get).toHaveBeenCalledWith('tohdah:refresh:u1:t1');
  });

  it('deleteRefreshToken calls client.del with correct key', async () => {
    await service.deleteRefreshToken('u1', 't1');
    expect(mockClient.del).toHaveBeenCalledWith('tohdah:refresh:u1:t1');
  });

  it('deleteAllRefreshTokens calls keys then del', async () => {
    mockClient.keys.mockResolvedValueOnce([
      'tohdah:refresh:u1:a',
      'tohdah:refresh:u1:b',
    ]);
    await service.deleteAllRefreshTokens('u1');
    expect(mockClient.keys).toHaveBeenCalledWith('tohdah:refresh:u1:*');
    expect(mockClient.del).toHaveBeenCalledWith(
      'tohdah:refresh:u1:a',
      'tohdah:refresh:u1:b',
    );
  });

  it('countSessions returns keys length', async () => {
    mockClient.keys.mockResolvedValueOnce(['k1', 'k2']);
    const n = await service.countSessions('u1');
    expect(n).toBe(2);
  });

  it('isHealthy returns true when ping returns PONG', async () => {
    mockClient.ping.mockResolvedValueOnce('PONG');
    await expect(service.isHealthy()).resolves.toBe(true);
  });

  it('isHealthy returns false when ping throws', async () => {
    mockClient.ping.mockRejectedValueOnce(new Error('down'));
    await expect(service.isHealthy()).resolves.toBe(false);
  });
});
