/**
 * App module registry (order matches `imports` array):
 * - ConfigModule — global env (.env)
 * - RedisModule — global Redis (refresh sessions, OTP, future cache)
 * - MongooseModule — MongoDB connection
 * - ThrottlerModule — rate limits (global guard)
 * - UsersModule — users, profiles, referrals/loyalty fields, reports, blocking
 * - AuthModule — JWT register/login/refresh, password reset, GET /auth/me
 * - OnboardingModule — onboarding steps and status
 * - TripsModule — traveler trip CRUD and browse
 * - RequestsModule — delivery request CRUD and browse
 * - NotificationsModule — in-app notifications
 * - BookingsModule — matching, payments, lifecycle, disputes
 * - PaymentsModule — Stripe PaymentIntents + webhooks
 * - ChatModule — booking-scoped messaging
 * - ReviewsModule — reviews and ratings
 * - TrustModule — trust score and verification stubs
 * - AdminModule — admin dashboard, moderation, disputes, impact
 * - UploadModule — image uploads (local or Cloudinary)
 */
import { Logger, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RequestsModule } from './requests/requests.module';
import { ReviewsModule } from './reviews/reviews.module';
import { TrustModule } from './trust/trust.module';
import { TripsModule } from './trips/trips.module';
import { UsersModule } from './users/users.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { AdminModule } from './admin/admin.module';
import { UploadModule } from './upload/upload.module';
import { PaymentsModule } from './payments/payments.module';
import { RedisModule } from './common/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('MONGODB_URI') ??
          'mongodb://127.0.0.1:27017/tohdah',
        connectionFactory: (connection: import('mongoose').Connection) => {
          connection.on('connected', () =>
            Logger.log('MongoDB connected', 'Mongoose'),
          );
          connection.on('disconnected', () =>
            Logger.warn('MongoDB disconnected', 'Mongoose'),
          );
          connection.on('error', (err: Error) =>
            Logger.error(`MongoDB error: ${err.message}`, 'Mongoose'),
          );
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'global',
            ttl: config.get<number>('THROTTLE_TTL_MS', 60_000),
            limit: config.get<number>('THROTTLE_LIMIT', 60),
          },
          { name: 'auth', ttl: 60_000, limit: 5 },
          { name: 'sensitive', ttl: 60_000, limit: 3 },
          { name: 'upload', ttl: 60_000, limit: 20 },
        ],
      }),
    }),
    UsersModule,
    AuthModule,
    OnboardingModule,
    TripsModule,
    RequestsModule,
    NotificationsModule,
    BookingsModule,
    PaymentsModule,
    ChatModule,
    ReviewsModule,
    TrustModule,
    AdminModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
