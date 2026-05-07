import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function firebaseErrorCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in err) {
    const c = (err as { code?: unknown }).code;
    return typeof c === 'string' ? c : undefined;
  }
  return undefined;
}

function firebaseErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return String(err);
}

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private app?: admin.app.App;

  constructor(private readonly config: ConfigService) {
    const serviceAccountPath = resolve(
      this.config.get<string>(
        'FIREBASE_SERVICE_ACCOUNT_PATH',
        './firebase-service-account.json',
      ),
    );

    try {
      const serviceAccount = JSON.parse(
        readFileSync(serviceAccountPath, 'utf8'),
      ) as admin.ServiceAccount;

      if (!admin.apps.length) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        this.app = admin.app();
      }
    } catch (err) {
      this.logger.warn(
        'Firebase service account not found or invalid. ' +
          'Push notifications will be disabled. ' +
          `Path: ${serviceAccountPath} (${firebaseErrorMessage(err)})`,
      );
    }
  }

  async sendToDevice(params: {
    token: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
  }): Promise<boolean> {
    if (!this.app) return false;

    try {
      await admin.messaging(this.app).send({
        token: params.token,
        notification: {
          title: params.title,
          body: params.body,
          ...(params.imageUrl ? { imageUrl: params.imageUrl } : {}),
        },
        data: params.data ?? {},
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        android: {
          notification: {
            sound: 'default',
            priority: 'high',
          },
        },
        webpush: {
          notification: {
            icon: '/favicon.svg',
            badge: '/favicon.svg',
          },
        },
      });
      return true;
    } catch (err) {
      const code = firebaseErrorCode(err);
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        this.logger.warn(`Invalid FCM token — should be removed: ${code}`);
        return false;
      }
      this.logger.error(`FCM send failed: ${firebaseErrorMessage(err)}`);
      return false;
    }
  }

  async sendToMultiple(params: {
    tokens: string[];
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<{ successCount: number; failedTokens: string[] }> {
    if (!this.app || !params.tokens.length) {
      return { successCount: 0, failedTokens: [] };
    }

    const results = await Promise.allSettled(
      params.tokens.map((token) =>
        this.sendToDevice({
          token,
          title: params.title,
          body: params.body,
          data: params.data,
        }),
      ),
    );

    const failedTokens: string[] = [];
    let successCount = 0;

    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value) {
        successCount++;
      } else {
        failedTokens.push(params.tokens[i]);
      }
    });

    return { successCount, failedTokens };
  }

  async sendToTopic(params: {
    topic: string;
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<boolean> {
    if (!this.app) return false;

    try {
      await admin.messaging(this.app).send({
        topic: params.topic,
        notification: { title: params.title, body: params.body },
        data: params.data ?? {},
      });
      return true;
    } catch (err) {
      this.logger.error(`FCM topic send failed: ${firebaseErrorMessage(err)}`);
      return false;
    }
  }

  isAvailable(): boolean {
    return !!this.app;
  }
}
