import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
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
