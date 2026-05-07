import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FcmService } from './fcm.service';

const mockReadFileSync = jest.fn();

jest.mock('fs', () => ({
  ...jest.requireActual<typeof import('fs')>('fs'),
  readFileSync: (...args: Parameters<typeof import('fs')['readFileSync']>) =>
    mockReadFileSync(...args),
}));

const goodAccountJson = JSON.stringify({
  type: 'service_account',
  project_id: 'test',
  private_key:
    '-----BEGIN RSA PRIVATE KEY-----\nMIIEogIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyF8PbnGy0AHB7MhgwC6NkfJQf\n-----END RSA PRIVATE KEY-----\n',
  client_email: 'x@test.iam.gserviceaccount.com',
});

jest.mock('firebase-admin', () => {
  const messagingSend = jest.fn().mockResolvedValue('mid');
  const apps: unknown[] = [];
  return {
    apps,
    initializeApp: jest.fn(() => {
      const app = {};
      apps.push(app);
      return app;
    }),
    credential: { cert: jest.fn(() => ({})) },
    app: jest.fn(() => apps[0]),
    messaging: jest.fn(() => ({ send: messagingSend })),
    __messagingSend: messagingSend,
    __apps: apps,
  };
});

const adminMock = admin as unknown as {
  __messagingSend: jest.Mock;
  __apps: unknown[];
};

describe('FcmService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  async function createService(): Promise<FcmService> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FcmService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_k: string, def?: string) => def),
          },
        },
      ],
    }).compile();
    return module.get(FcmService);
  }

  beforeEach(() => {
    adminMock.__apps.length = 0;
    adminMock.__messagingSend.mockReset();
    adminMock.__messagingSend.mockResolvedValue('mid');
    mockReadFileSync.mockReturnValue(goodAccountJson);
  });

  it('sendToDevice returns true on success', async () => {
    const service = await createService();
    const ok = await service.sendToDevice({
      token: 'tok',
      title: 'T',
      body: 'B',
    });
    expect(ok).toBe(true);
    expect(adminMock.__messagingSend).toHaveBeenCalled();
  });

  it('sendToDevice returns false for invalid token error', async () => {
    const service = await createService();
    adminMock.__messagingSend.mockRejectedValueOnce({
      code: 'messaging/invalid-registration-token',
      message: 'bad',
    });
    const ok = await service.sendToDevice({
      token: 'bad',
      title: 'T',
      body: 'B',
    });
    expect(ok).toBe(false);
  });

  it('sendToDevice returns false when app not initialized', async () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    const service = await createService();
    expect(service.isAvailable()).toBe(false);
    const ok = await service.sendToDevice({
      token: 'tok',
      title: 'T',
      body: 'B',
    });
    expect(ok).toBe(false);
  });

  it('sendToMultiple aggregates successCount and failedTokens', async () => {
    const service = await createService();
    adminMock.__messagingSend
      .mockResolvedValueOnce('a')
      .mockRejectedValueOnce({
        code: 'messaging/invalid-registration-token',
        message: 'x',
      })
      .mockResolvedValueOnce('c');

    const res = await service.sendToMultiple({
      tokens: ['t1', 't2', 't3'],
      title: 'T',
      body: 'B',
    });

    expect(res.successCount).toBe(2);
    expect(res.failedTokens).toEqual(['t2']);
  });

  it('isAvailable returns false when service account missing', async () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('missing');
    });
    const service = await createService();
    expect(service.isAvailable()).toBe(false);
  });
});
