import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import type { UserDocument } from '../users/schemas/user.schema';
import { Types } from 'mongoose';

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<Partial<UsersService>>;
  let jwt: jest.Mocked<Pick<JwtService, 'signAsync' | 'verifyAsync'>>;
  let config: { getOrThrow: jest.Mock };
  let email: {
    sendWelcome: jest.Mock;
    sendPasswordReset: jest.Mock;
    sendOtp: jest.Mock;
  };
  let redis: {
    setRefreshToken: jest.Mock;
    getRefreshToken: jest.Mock;
    deleteRefreshToken: jest.Mock;
    deleteAllRefreshTokens: jest.Mock;
    set: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
  };

  const userObjectId = new Types.ObjectId();
  const userId = userObjectId.toString();
  const jti = '11111111-1111-1111-1111-111111111111';

  const mockUser = {
    _id: userObjectId,
    fullName: 'Test User',
    email: 'test@example.com',
    phoneNumber: '+1 555',
    passwordHash: 'hashed-password',
    accountType: undefined,
    accountStatus: 'active' as const,
    onboardingCompleted: true,
    googleId: undefined as string | undefined,
    isVerified: false,
    get: jest.fn((k: string) => (k === 'createdAt' ? new Date('2020-01-01') : new Date('2020-01-02'))),
  } as unknown as UserDocument;

  beforeEach(() => {
    users = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      comparePassword: jest.fn(),
      hashRefreshToken: jest.fn(),
      compareRefreshToken: jest.fn(),
      updateRefreshTokenHash: jest.fn(),
      setOtp: jest.fn(),
      clearOtpFields: jest.fn(),
      setPasswordFromPlain: jest.fn(),
      createGoogleUser: jest.fn(),
      updateGoogleId: jest.fn(),
      findByGoogleId: jest.fn(),
    };
    jwt = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };
    config = {
      getOrThrow: jest.fn((key: string) => `secret-for-${key}`),
    };
    email = {
      sendWelcome: jest.fn().mockResolvedValue(undefined),
      sendPasswordReset: jest.fn().mockResolvedValue(undefined),
      sendOtp: jest.fn().mockResolvedValue(undefined),
    };
    redis = {
      setRefreshToken: jest.fn().mockResolvedValue(undefined),
      getRefreshToken: jest.fn(),
      deleteRefreshToken: jest.fn().mockResolvedValue(undefined),
      deleteAllRefreshTokens: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(undefined),
    };
    service = new AuthService(
      users as unknown as UsersService,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
      email as never,
      redis as never,
    );
  });

  it('register throws when email exists', async () => {
    users.findByEmail.mockResolvedValue(mockUser);
    await expect(
      service.register({
        fullName: 'A',
        email: 'test@example.com',
        phoneNumber: '+15550000',
        password: 'password1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(email.sendWelcome).not.toHaveBeenCalled();
  });

  it('register sends welcome email after create', async () => {
    users.findByEmail.mockResolvedValue(null);
    users.create.mockResolvedValue(mockUser);
    await service.register({
      fullName: 'Test User',
      email: 'test@example.com',
      phoneNumber: '+15550000',
      password: 'Password1',
    });
    expect(email.sendWelcome).toHaveBeenCalledWith(
      'test@example.com',
      'Test User',
    );
  });

  it('login throws when user missing', async () => {
    users.findByEmail.mockResolvedValue(null);
    await expect(
      service.login({ email: 'a@b.com', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login returns tokens and stores refresh in Redis', async () => {
    users.findByEmail.mockResolvedValue(mockUser);
    users.comparePassword.mockResolvedValue(true);
    jwt.signAsync
      .mockResolvedValueOnce('access.jwt')
      .mockResolvedValueOnce('refresh.jwt');
    users.hashRefreshToken.mockResolvedValue('rt-hash');

    const res = await service.login({
      email: 'test@example.com',
      password: 'password1',
    });

    expect(res).toEqual({
      accessToken: 'access.jwt',
      refreshToken: 'refresh.jwt',
      user: {
        id: userId,
        fullName: 'Test User',
        email: 'test@example.com',
        accountType: null,
      },
    });
    expect(redis.setRefreshToken).toHaveBeenCalled();
    const [uid, tokenId, hash] = redis.setRefreshToken.mock.calls[0] as [
      string,
      string,
      string,
    ];
    expect(uid).toBe(userId);
    expect(typeof tokenId).toBe('string');
    expect(tokenId.length).toBeGreaterThan(10);
    expect(hash).toBe('rt-hash');
  });

  it('refresh rotates tokens when Redis hash matches', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: userId, jti });
    users.findById.mockResolvedValue(mockUser);
    redis.getRefreshToken.mockResolvedValue('stored-hash');
    users.compareRefreshToken.mockResolvedValue(true);
    jwt.signAsync
      .mockResolvedValueOnce('new-access')
      .mockResolvedValueOnce('new-refresh');
    users.hashRefreshToken.mockResolvedValue('new-rt-hash');

    const res = await service.refresh('old-refresh');

    expect(res).toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    expect(redis.getRefreshToken).toHaveBeenCalledWith(userId, jti);
    expect(redis.deleteRefreshToken).toHaveBeenCalledWith(userId, jti);
    expect(redis.setRefreshToken).toHaveBeenCalled();
    const call = redis.setRefreshToken.mock.calls[0] as [string, string, string];
    expect(call[0]).toBe(userId);
    expect(call[2]).toBe('new-rt-hash');
  });

  it('refresh with invalid hash revokes all sessions', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: userId, jti });
    users.findById.mockResolvedValue(mockUser);
    redis.getRefreshToken.mockResolvedValue('stored-hash');
    users.compareRefreshToken.mockResolvedValue(false);

    await expect(service.refresh('bad-refresh')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(redis.deleteAllRefreshTokens).toHaveBeenCalledWith(userId);
  });

  it('logout deletes refresh token in Redis when valid', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: userId, jti });

    const res = await service.logout('rt');

    expect(res).toEqual({ message: 'Logged out' });
    expect(redis.deleteRefreshToken).toHaveBeenCalledWith(userId, jti);
  });

  it('logout returns message when token invalid', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('expired'));

    const res = await service.logout('rt');

    expect(res).toEqual({ message: 'Logged out' });
    expect(redis.deleteRefreshToken).not.toHaveBeenCalled();
  });

  it('forgot-password returns generic message when user not found', async () => {
    users.findByEmail.mockResolvedValue(null);
    const res = await service.forgotPassword({ email: 'missing@example.com' });
    expect(res.message).toContain('If this email is registered');
    expect(redis.set).not.toHaveBeenCalled();
    expect(email.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('forgot-password stores OTP in Redis when user exists', async () => {
    users.findByEmail.mockResolvedValue(mockUser);
    const res = await service.forgotPassword({ email: 'test@example.com' });
    expect(res.message).toContain('If this email is registered');
    expect(redis.set).toHaveBeenCalledWith(
      'tohdah:otp:test@example.com',
      expect.any(String),
      600,
    );
    expect(email.sendPasswordReset).toHaveBeenCalledWith(
      'test@example.com',
      expect.any(String),
      'Test User',
    );
  });

  it('verifyOtp returns reset token when OTP valid in Redis', async () => {
    users.findByEmail.mockResolvedValue(mockUser);
    redis.get.mockResolvedValue('123456');
    jwt.signAsync.mockResolvedValue('reset.jwt');

    const res = await service.verifyOtp({
      email: 'test@example.com',
      otp: '123456',
    });

    expect(res).toEqual({ passwordResetToken: 'reset.jwt' });
    expect(redis.del).toHaveBeenCalledWith('tohdah:otp:test@example.com');
    expect(users.clearOtpFields).not.toHaveBeenCalled();
  });

  it('resetPassword updates password and clears Redis sessions', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: userId });
    users.findById.mockResolvedValue(mockUser);

    await service.resetPassword({
      passwordResetToken: 'tok',
      newPassword: 'newpass1',
    });

    expect(users.setPasswordFromPlain).toHaveBeenCalledWith(userId, 'newpass1');
    expect(redis.deleteAllRefreshTokens).toHaveBeenCalledWith(userId);
  });

  describe('findOrCreateGoogleUser', () => {
    beforeEach(() => {
      jwt.signAsync
        .mockResolvedValueOnce('ga-access')
        .mockResolvedValueOnce('ga-refresh');
      users.hashRefreshToken.mockResolvedValue('ga-rt-hash');
    });

    it('creates new account, verifies email flag, sends welcome, returns tokens', async () => {
      users.findByEmail.mockResolvedValue(null);
      const googleUser = {
        ...mockUser,
        onboardingCompleted: false,
        googleId: 'gid-new',
      } as UserDocument;
      users.createGoogleUser.mockResolvedValue(googleUser);

      const res = await service.findOrCreateGoogleUser({
        googleId: 'gid-new',
        email: 'new@example.com',
        fullName: 'Google User',
        profilePhoto: 'https://x/photo.jpg',
      });

      expect(users.createGoogleUser).toHaveBeenCalledWith({
        googleId: 'gid-new',
        email: 'new@example.com',
        fullName: 'Google User',
        profilePhoto: 'https://x/photo.jpg',
        authProvider: 'google',
        isEmailVerified: true,
      });
      expect(email.sendWelcome).toHaveBeenCalledWith(
        googleUser.email,
        googleUser.fullName,
      );
      expect(res).toMatchObject({
        accessToken: 'ga-access',
        refreshToken: 'ga-refresh',
        isNewUser: true,
      });
      expect(redis.setRefreshToken).toHaveBeenCalled();
    });

    it('links googleId on existing account and skips update when already linked', async () => {
      const linked = {
        ...mockUser,
        googleId: 'gid-existing',
      } as UserDocument;
      users.findByEmail.mockResolvedValue(linked);

      const res = await service.findOrCreateGoogleUser({
        googleId: 'gid-existing',
        email: 'test@example.com',
        fullName: 'Test User',
        profilePhoto: null,
      });

      expect(users.updateGoogleId).not.toHaveBeenCalled();
      expect(users.findById).not.toHaveBeenCalled();
      expect(res.isNewUser).toBe(false);
      expect(res.accessToken).toBe('ga-access');
    });

    it('calls updateGoogleId when existing user has no googleId', async () => {
      const existing = {
        ...mockUser,
        googleId: undefined,
        _id: userObjectId,
      } as UserDocument;
      const reloaded = { ...existing, googleId: 'gid-link' } as UserDocument;
      users.findByEmail.mockResolvedValue(existing);
      users.updateGoogleId.mockResolvedValue(undefined);
      users.findById.mockResolvedValue(reloaded);

      await service.findOrCreateGoogleUser({
        googleId: 'gid-link',
        email: 'test@example.com',
        fullName: 'Test User',
        profilePhoto: null,
      });

      expect(users.updateGoogleId).toHaveBeenCalledWith(userId, 'gid-link');
      expect(users.findById).toHaveBeenCalledWith(userId);
    });

    it('throws when account is not active', async () => {
      users.findByEmail.mockResolvedValue({
        ...mockUser,
        accountStatus: 'suspended',
      } as UserDocument);

      await expect(
        service.findOrCreateGoogleUser({
          googleId: 'gid',
          email: 'test@example.com',
          fullName: 'X',
          profilePhoto: null,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(users.createGoogleUser).not.toHaveBeenCalled();
    });
  });
});
