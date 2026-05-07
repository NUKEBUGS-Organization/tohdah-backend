import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

export type GoogleOAuthResult = {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<GoogleOAuthResult> {
    const email = profile.emails?.[0]?.value?.trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException('No email returned from Google');
    }

    const photo = profile.photos?.[0]?.value ?? null;
    const fullName =
      profile.displayName?.trim() || email.split('@')[0] || 'User';

    return this.authService.findOrCreateGoogleUser({
      googleId: profile.id,
      email,
      fullName,
      profilePhoto: photo,
    });
  }
}
