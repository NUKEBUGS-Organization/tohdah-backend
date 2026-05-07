"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadThrottle = exports.SensitiveThrottle = exports.AuthThrottle = exports.SkipAllThrottlers = void 0;
const throttler_1 = require("@nestjs/throttler");
const SkipAllThrottlers = () => (0, throttler_1.SkipThrottle)({ global: true, auth: true, sensitive: true, upload: true });
exports.SkipAllThrottlers = SkipAllThrottlers;
const AuthThrottle = () => (0, throttler_1.Throttle)({ auth: { ttl: 60_000, limit: 5 } });
exports.AuthThrottle = AuthThrottle;
const SensitiveThrottle = () => (0, throttler_1.Throttle)({ sensitive: { ttl: 60_000, limit: 3 } });
exports.SensitiveThrottle = SensitiveThrottle;
const UploadThrottle = () => (0, throttler_1.Throttle)({ upload: { ttl: 60_000, limit: 20 } });
exports.UploadThrottle = UploadThrottle;
//# sourceMappingURL=throttle.decorator.js.map