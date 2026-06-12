import {
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CaptchaService } from './captcha.service';

describe('CaptchaService', () => {
  let service: CaptchaService;

  beforeEach(() => {
    const config = { getOrThrow: jest.fn().mockReturnValue('secreto-test') };
    service = new CaptchaService(config as unknown as ConfigService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('rechaza cuando no llega token', async () => {
    await expect(service.verify('')).rejects.toThrow(BadRequestException);
  });

  it('rechaza cuando Google responde success=false', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: false }),
    }) as unknown as typeof fetch;
    await expect(service.verify('token-malo')).rejects.toThrow(UnauthorizedException);
  });

  it('acepta cuando Google responde success=true', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }) as unknown as typeof fetch;
    await expect(service.verify('token-bueno')).resolves.toBeUndefined();
  });

  it('responde 503 cuando Google no está disponible', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('network down')) as unknown as typeof fetch;
    await expect(service.verify('token')).rejects.toThrow(ServiceUnavailableException);
  });
});
