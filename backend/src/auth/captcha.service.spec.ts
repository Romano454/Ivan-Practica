import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CaptchaService } from './captcha.service';

describe('CaptchaService', () => {
  let service: CaptchaService;

  beforeEach(() => {
    const config = { get: jest.fn().mockReturnValue('secreto-test') };
    service = new CaptchaService(config as unknown as ConfigService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('rechaza cuando no llega token', async () => {
    await expect(service.verify('')).rejects.toThrow(BadRequestException);
  });

  it('rechaza cuando Google responde success=false', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false }),
    }) as unknown as typeof fetch;
    await expect(service.verify('token-malo')).rejects.toThrow(UnauthorizedException);
  });

  it('acepta cuando Google responde success=true', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    }) as unknown as typeof fetch;
    await expect(service.verify('token-bueno')).resolves.toBeUndefined();
  });
});
