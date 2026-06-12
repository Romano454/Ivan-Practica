import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { evaluatePasswordStrength } from '../auth/password-strength';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email })
      .getOne();
  }

  findById(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  create(data: {
    name: string;
    email: string;
    passwordHash: string;
    role?: UserRole;
  }): Promise<User> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  // Incluye eliminados para que el ADMIN pueda restaurarlos
  findAllWithDeleted(): Promise<User[]> {
    return this.repo.find({ withDeleted: true, order: { name: 'ASC' } });
  }

  async adminCreate(dto: CreateUserDto): Promise<User> {
    await this.ensureEmailFree(dto.email);
    this.ensureStrongEnough(dto.password);
    const user = await this.create({
      name: dto.name,
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, 10),
      role: dto.role,
    });
    return this.sanitize(user);
  }

  async adminUpdate(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (dto.email && dto.email !== user.email) {
      await this.ensureEmailFree(dto.email);
      user.email = dto.email;
    }
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.password) {
      this.ensureStrongEnough(dto.password);
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    return this.sanitize(await this.repo.save(user));
  }

  async softDelete(id: number): Promise<{ message: string }> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.repo.softDelete(id);
    return { message: 'Usuario eliminado' };
  }

  async restore(id: number): Promise<{ message: string }> {
    const user = await this.repo.findOne({ where: { id }, withDeleted: true });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.repo.restore(id);
    return { message: 'Usuario restaurado' };
  }

  private async ensureEmailFree(email: string): Promise<void> {
    const exists = await this.repo.findOne({
      where: { email },
      withDeleted: true,
    });
    if (exists) throw new ConflictException('El email ya está registrado');
  }

  private ensureStrongEnough(password: string): void {
    if (evaluatePasswordStrength(password) === 'debil') {
      throw new BadRequestException(
        'La contraseña es débil: use una más larga combinando mayúsculas, números y símbolos',
      );
    }
  }

  // El hash puede venir presente cuando el repo lo guardó; no debe salir en la respuesta
  private sanitize(user: User): User {
    delete (user as Partial<User>).passwordHash;
    return user;
  }

  // Crea el administrador inicial si no existe (primer arranque)
  async onApplicationBootstrap(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !password) return;
    const exists = await this.repo.findOne({ where: { email }, withDeleted: true });
    if (exists) return;
    await this.create({
      name: this.config.get('ADMIN_NAME', 'Administrador'),
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: UserRole.ADMIN,
    });
    this.logger.log(`Usuario administrador inicial creado: ${email}`);
  }
}
