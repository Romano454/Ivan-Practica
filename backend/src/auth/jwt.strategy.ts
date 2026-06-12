import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthUser } from './decorators/current-user.decorator';

interface JwtPayload {
  sub: number;
  email: string;
  name: string;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Consulta la BD en cada request: un usuario desactivado o eliminado
  // pierde acceso de inmediato y los cambios de rol aplican sin re-login
  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Sesión no válida o usuario inactivo');
    }
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
