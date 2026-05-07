import { SkipThrottle, Throttle } from '@nestjs/throttler';

/** Skip every named throttler (global + route-specific limits). */
export const SkipAllThrottlers = () =>
  SkipThrottle({ global: true, auth: true, sensitive: true, upload: true });

/** Auth endpoints — strict */
export const AuthThrottle = () =>
  Throttle({ auth: { ttl: 60_000, limit: 5 } });

/** OTP / forgot password — very strict */
export const SensitiveThrottle = () =>
  Throttle({ sensitive: { ttl: 60_000, limit: 3 } });

/** Upload endpoints */
export const UploadThrottle = () =>
  Throttle({ upload: { ttl: 60_000, limit: 20 } });
