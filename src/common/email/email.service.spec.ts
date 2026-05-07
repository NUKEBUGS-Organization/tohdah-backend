import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

const sendMock = jest.fn().mockResolvedValue({});

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    const config = {
      get: jest.fn((k: string) => {
        if (k === 'RESEND_API_KEY') return 're_test';
        if (k === 'EMAIL_FROM') return 'noreply@tohdah.com';
        if (k === 'FRONTEND_URL') return 'http://localhost:5173';
        return undefined;
      }),
    } as unknown as ConfigService;
    service = new EmailService(config);
  });

  it('sendOtp calls resend.emails.send with subject and html', async () => {
    await service.sendOtp('u@x.com', '111222', 'Pat');
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'u@x.com',
        subject: 'Your Tohdah verification code',
      }),
    );
    const html = sendMock.mock.calls[0][0].html as string;
    expect(html).toContain('111222');
  });

  it('sendPasswordReset uses correct subject line', async () => {
    await service.sendPasswordReset('u@x.com', '999888', 'Pat');
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Reset your Tohdah password',
      }),
    );
  });

  it('send failure logs error and does not throw', async () => {
    sendMock.mockRejectedValueOnce(new Error('network'));
    await expect(
      service.sendWelcome('u@x.com', 'Pat'),
    ).resolves.toBeUndefined();
  });
});

describe('EmailService without API key', () => {
  it('send does not call resend when key missing', async () => {
    sendMock.mockClear();
    const config = {
      get: jest.fn(() => undefined),
    } as unknown as ConfigService;
    const svc = new EmailService(config);
    await svc.sendWelcome('u@x.com', 'Pat');
    expect(sendMock).not.toHaveBeenCalled();
  });
});
