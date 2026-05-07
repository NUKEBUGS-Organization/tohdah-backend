import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.GOOGLE_CLIENT_ID ??= 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET ??= 'test-google-secret';
    process.env.GOOGLE_CALLBACK_URL ??=
      'http://localhost:3000/api/v1/auth/google/callback';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.body.service).toBe('tohdah-api');
        expect(res.body.status).toBe('ok');
        expect(['connected', 'unavailable']).toContain(res.body.redis);
        expect(typeof res.body.timestamp).toBe('string');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
