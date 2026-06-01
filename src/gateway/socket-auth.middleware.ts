import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export type AuthenticatedSocket = Socket & {
  userId: string;
  email: string;
};

export function createSocketAuthMiddleware(
  jwtService: JwtService,
  config: ConfigService,
) {
  return async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = jwtService.verify<{ sub: string; email: string }>(
        token,
        { secret: config.get<string>('JWT_ACCESS_SECRET') },
      );

      socket.userId = payload.sub;
      socket.email = payload.email;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  };
}
