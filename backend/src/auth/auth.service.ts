import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AccessEvent } from '../access-logs/access-log.entity';
import { AccessLogsService } from '../access-logs/access-logs.service';
import { UsersService } from '../users/users.service';
import { CaptchaService } from './captcha.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { evaluatePasswordStrength } from './password-strength';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly captcha: CaptchaService,
    private readonly jwt: JwtService,
    private readonly accessLogs: AccessLogsService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.users.findByEmail(dto.email);
    if (exists) {
      throw new ConflictException('El email ya está registrado');
    }
    const strength = evaluatePasswordStrength(dto.password);
    if (strength === 'debil') {
      throw new BadRequestException(
        'La contraseña es débil: use una más larga combinando mayúsculas, números y símbolos',
      );
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      passwordStrength: strength,
    };
  }

  async login(dto: LoginDto, ip: string, userAgent: string) {
    await this.captcha.verify(dto.captchaToken);
    const user = await this.users.findByEmail(dto.email);
    const valid = user && (await bcrypt.compare(dto.password, user.passwordHash));
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('El usuario está inactivo');
    }
    await this.accessLogs.record(user.id, AccessEvent.INGRESO, ip, userAgent);
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async logout(userId: number, ip: string, userAgent: string) {
    await this.accessLogs.record(userId, AccessEvent.SALIDA, ip, userAgent);
    return { message: 'Sesión cerrada' };
  }
}
