"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const throttler_1 = require("@nestjs/throttler");
const app_controller_1 = require("./app.controller");
const auth_module_1 = require("./auth/auth.module");
const bookings_module_1 = require("./bookings/bookings.module");
const chat_module_1 = require("./chat/chat.module");
const notifications_module_1 = require("./notifications/notifications.module");
const requests_module_1 = require("./requests/requests.module");
const reviews_module_1 = require("./reviews/reviews.module");
const trust_module_1 = require("./trust/trust.module");
const trips_module_1 = require("./trips/trips.module");
const users_module_1 = require("./users/users.module");
const onboarding_module_1 = require("./onboarding/onboarding.module");
const admin_module_1 = require("./admin/admin.module");
const upload_module_1 = require("./upload/upload.module");
const payments_module_1 = require("./payments/payments.module");
const redis_module_1 = require("./common/redis/redis.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            redis_module_1.RedisModule,
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (config) => ({
                    uri: config.get('MONGODB_URI') ??
                        'mongodb://127.0.0.1:27017/tohdah',
                    connectionFactory: (connection) => {
                        connection.on('connected', () => common_1.Logger.log('MongoDB connected', 'Mongoose'));
                        connection.on('disconnected', () => common_1.Logger.warn('MongoDB disconnected', 'Mongoose'));
                        connection.on('error', (err) => common_1.Logger.error(`MongoDB error: ${err.message}`, 'Mongoose'));
                        return connection;
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    throttlers: [
                        {
                            name: 'global',
                            ttl: config.get('THROTTLE_TTL_MS', 60_000),
                            limit: config.get('THROTTLE_LIMIT', 60),
                        },
                        { name: 'auth', ttl: 60_000, limit: 5 },
                        { name: 'sensitive', ttl: 60_000, limit: 3 },
                        { name: 'upload', ttl: 60_000, limit: 20 },
                    ],
                }),
            }),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            onboarding_module_1.OnboardingModule,
            trips_module_1.TripsModule,
            requests_module_1.RequestsModule,
            notifications_module_1.NotificationsModule,
            bookings_module_1.BookingsModule,
            payments_module_1.PaymentsModule,
            chat_module_1.ChatModule,
            reviews_module_1.ReviewsModule,
            trust_module_1.TrustModule,
            admin_module_1.AdminModule,
            upload_module_1.UploadModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [{ provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard }],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map