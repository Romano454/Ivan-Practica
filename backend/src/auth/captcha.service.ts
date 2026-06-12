import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
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
    const secret = this.config.getOrThrow<string>('RECAPTCHA_SECRET');
    const body = `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`;
    let data: { success: boolean };
    try {
      const res = await fetch(VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        throw new Error(`Respuesta HTTP ${res.status}`);
      }
      data = (await res.json()) as { success: boolean };
    } catch {
      throw new ServiceUnavailableException(
        'No se pudo verificar el CAPTCHA, intente nuevamente',
      );
    }
    if (!data.success) {
      throw new UnauthorizedException('CAPTCHA inválido, intente nuevamente');
    }
  }
}
