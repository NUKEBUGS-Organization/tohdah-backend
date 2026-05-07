import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

export type RefreshJwtPayload = {
  sub: string;
  jti: string;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: RefreshJwtPayload) {
    const refreshToken = (req.body as { refreshToken?: string })?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }
    if (!payload?.jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { userId: payload.sub, jti: payload.jti, refreshToken };
  }
}
