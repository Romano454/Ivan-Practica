import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

@Injectable()
export class CaptchaService {
  constructor(private readonly config: ConfigService) {}

  async verify(token: string): Promise<void> {
    if (!token) {
      throw new BadRequestException('Complete el CAPTCHA');
    }
    const secret = this.config.get<string>('RECAPTCHA_SECRET') ?? '';
    const body = `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`;
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = (await res.json()) as { success: boolean };
    if (!data.success) {
      throw new UnauthorizedException('CAPTCHA inválido, intente nuevamente');
    }
  }
}
