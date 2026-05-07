"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const sanitize_pipe_1 = require("./common/pipes/sanitize.pipe");
const upload_service_1 = require("./upload/upload.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
    });
    app.useBodyParser('json', { limit: '1mb' });
    app.useBodyParser('urlencoded', { extended: true, limit: '1mb' });
    app.use((0, compression_1.default)());
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
            },
        },
    }));
    const uploadRoot = (0, upload_service_1.resolveUploadRootFromEnv)();
    app.useStaticAssets(uploadRoot, {
        prefix: '/uploads/',
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }), new sanitize_pipe_1.SanitizePipe());
    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',') ?? [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
        ],
        credentials: true,
    });
    app.enableShutdownHooks();
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    common_1.Logger.log(`Listening on ${port}`, 'Bootstrap');
}
bootstrap();
//# sourceMappingURL=main.js.map