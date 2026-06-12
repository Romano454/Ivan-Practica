# MediCitas — Fase 1: Base y Seguridad — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Monorepo con backend NestJS y frontend React funcionando, con autenticación completa: login JWT + reCAPTCHA v2, registro con medidor de fuerza de contraseña (hash bcrypt), roles ADMIN/RECEPCIONISTA con guards, y log de accesos (usuario, IP, evento, navegador, fecha/hora).

**Architecture:** Monorepo `backend/` (NestJS 10 + TypeORM + PostgreSQL) y `frontend/` (React 18 + Vite + TS + Material UI). El backend expone API REST bajo `/api` con guards JWT y de roles globales; el frontend usa proxy de Vite en desarrollo y guarda la sesión en localStorage. PostgreSQL corre en Docker localmente.

**Tech Stack:** NestJS, TypeORM, PostgreSQL, passport-jwt, bcryptjs, zxcvbn, class-validator, React, Vite, Material UI, react-hook-form, zod, react-google-recaptcha, axios.

**Convenciones:**
- Comandos de backend se ejecutan desde `backend/`; de frontend desde `frontend/`; git desde la raíz `I:\Proyectos4\Ivan`.
- Los comandos `curl` se ejecutan con la herramienta Bash (o Git Bash).
- En desarrollo se usan las **claves de prueba de Google reCAPTCHA** (siempre validan): site key `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`, secret `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`. Las claves reales se registran en la Fase 4 (despliegue).

---

### Task 1: Estructura raíz del monorepo

**Files:**
- Create: `.gitignore`
- Create: `docker-compose.yml`
- Create: `README.md`

- [ ] **Step 1: Crear `.gitignore` raíz**

```gitignore
node_modules/
dist/
build/
coverage/
.env
*.log
.DS_Store
```

- [ ] **Step 2: Crear `docker-compose.yml` con PostgreSQL para desarrollo**

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: medicitas-db
    environment:
      POSTGRES_USER: medicitas
      POSTGRES_PASSWORD: medicitas
      POSTGRES_DB: medicitas
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

(En la Fase 4 se agregan los servicios backend y frontend. Si no hay Docker disponible, instalar PostgreSQL 16 local con el mismo usuario/contraseña/BD, o usar una BD gratuita en Neon y ajustar el `.env` del backend.)

- [ ] **Step 3: Crear `README.md` inicial**

```markdown
# MediCitas — Sistema de Gestión de Citas Médicas

Proyecto académico individual. Frontend en React, backend en NestJS, PostgreSQL.

## Estructura

- `backend/` — API REST (NestJS + TypeORM)
- `frontend/` — SPA (React + Vite + Material UI)
- `k8s/` — manifiestos Kubernetes (Fase 4)
- `docs/` — diseño y planes

## Desarrollo

1. Base de datos: `docker compose up -d db`
2. Backend: `cd backend && npm install && npm run start:dev` (http://localhost:3000/api)
3. Frontend: `cd frontend && npm install && npm run dev` (http://localhost:5173)

Usuario inicial: ver variables `ADMIN_*` en `backend/.env.example`.
```

- [ ] **Step 4: Levantar la base de datos y verificar**

Run: `docker compose up -d db` y luego `docker compose ps`
Expected: servicio `medicitas-db` con estado `running`/`healthy`.

- [ ] **Step 5: Commit**

```bash
git add .gitignore docker-compose.yml README.md
git commit -m "chore: estructura raíz del monorepo con base de datos de desarrollo"
```

---

### Task 2: Scaffold del backend NestJS

**Files:**
- Create: `backend/` (scaffold del CLI de NestJS)
- Modify: `backend/src/main.ts`

- [ ] **Step 1: Generar el proyecto NestJS**

Run (desde la raíz): `npx -y @nestjs/cli@10 new backend --package-manager npm --skip-git`
Expected: carpeta `backend/` creada con `src/`, `package.json`, y dependencias instaladas sin errores.

- [ ] **Step 2: Instalar dependencias de la fase**

Run (desde `backend/`):

```bash
npm install @nestjs/config @nestjs/typeorm typeorm pg @nestjs/jwt @nestjs/passport passport passport-jwt bcryptjs zxcvbn class-validator class-transformer
npm install -D @types/passport-jwt @types/bcryptjs @types/zxcvbn
```

Expected: instalación sin errores.

- [ ] **Step 3: Configurar `backend/src/main.ts`** (reemplazar el contenido)

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // Necesario para leer la IP real detrás de proxies (Render, Vercel)
  app.getHttpAdapter().getInstance().set('trust proxy', true);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

- [ ] **Step 4: Verificar que arranca**

Run (desde `backend/`): `npm run start:dev` (detener con Ctrl+C tras verificar)
Expected: `Nest application successfully started`; `GET http://localhost:3000/api` responde `Hello World!`.

- [ ] **Step 5: Commit**

```bash
git add backend
git commit -m "feat(backend): scaffold NestJS con prefijo /api, CORS y validación global"
```

---

### Task 3: Configuración de base de datos (TypeORM + ConfigModule)

**Files:**
- Create: `backend/.env`
- Create: `backend/.env.example`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Crear `backend/.env.example`** (se versiona; el `.env` real no)

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=medicitas
DB_PASSWORD=medicitas
DB_NAME=medicitas

# JWT
JWT_SECRET=cambiar-por-un-secreto-largo-y-aleatorio
JWT_EXPIRES=8h

# Google reCAPTCHA v2 (claves de PRUEBA: siempre validan; cambiar en producción)
RECAPTCHA_SECRET=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe

# Usuario administrador inicial (seed)
ADMIN_NAME=Administrador
ADMIN_EMAIL=admin@medicitas.com
ADMIN_PASSWORD=Admin#2026!

# CORS
FRONTEND_URL=http://localhost:5173
```

- [ ] **Step 2: Copiar a `backend/.env`**

Run (desde `backend/`): `cp .env.example .env` (PowerShell: `Copy-Item .env.example .env`)
En `.env`, reemplazar `JWT_SECRET` por una cadena aleatoria larga (por ej. generar con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).

- [ ] **Step 3: Configurar `backend/src/app.module.ts`** (reemplazar el contenido)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'medicitas'),
        password: config.get('DB_PASSWORD', 'medicitas'),
        database: config.get('DB_NAME', 'medicitas'),
        autoLoadEntities: true,
        // synchronize solo en desarrollo académico; en producción se usarían migraciones
        synchronize: true,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 4: Verificar conexión**

Run (desde `backend/`): `npm run start:dev` (detener tras verificar)
Expected: arranca sin errores de conexión (si falla, revisar que `docker compose up -d db` esté corriendo).

- [ ] **Step 5: Commit**

```bash
git add backend/.env.example backend/src/app.module.ts
git commit -m "feat(backend): conexión a PostgreSQL con TypeORM y configuración por entorno"
```

---

### Task 4: Entidad User, UsersModule y seed del administrador

**Files:**
- Create: `backend/src/users/user.entity.ts`
- Create: `backend/src/users/users.service.ts`
- Create: `backend/src/users/users.module.ts`
- Modify: `backend/src/app.module.ts` (importar UsersModule)

- [ ] **Step 1: Crear `backend/src/users/user.entity.ts`**

```typescript
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  RECEPCIONISTA = 'RECEPCIONISTA',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  // select: false evita que el hash se filtre en consultas normales
  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.RECEPCIONISTA })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
```

- [ ] **Step 2: Crear `backend/src/users/users.service.ts`**

```typescript
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
```

- [ ] **Step 3: Crear `backend/src/users/users.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 4: Registrar `UsersModule` en `backend/src/app.module.ts`**

Agregar el import y añadirlo al final del array `imports`:

```typescript
import { UsersModule } from './users/users.module';
// ...
  imports: [
    // ... ConfigModule y TypeOrmModule como estaban ...
    UsersModule,
  ],
```

- [ ] **Step 5: Verificar seed**

Run (desde `backend/`): `npm run start:dev` (detener tras verificar)
Expected: en el log aparece `Usuario administrador inicial creado: admin@medicitas.com` (solo el primer arranque) y la tabla `users` existe en la BD.

- [ ] **Step 6: Commit**

```bash
git add backend/src/users backend/src/app.module.ts
git commit -m "feat(backend): entidad User con borrado lógico y seed del administrador"
```

---

### Task 5: Medidor de fuerza de contraseña (TDD)

**Files:**
- Create: `backend/src/auth/password-strength.ts`
- Test: `backend/src/auth/password-strength.spec.ts`

- [ ] **Step 1: Escribir el test que falla** — `backend/src/auth/password-strength.spec.ts`

```typescript
import { evaluatePasswordStrength } from './password-strength';

describe('evaluatePasswordStrength', () => {
  it('clasifica contraseñas triviales como débiles', () => {
    expect(evaluatePasswordStrength('123456')).toBe('debil');
    expect(evaluatePasswordStrength('password')).toBe('debil');
    expect(evaluatePasswordStrength('abc123')).toBe('debil');
  });

  it('clasifica contraseñas largas y aleatorias como fuertes', () => {
    expect(evaluatePasswordStrength('xK#9$mQ2&vL7!pR4')).toBe('fuerte');
  });

  it('siempre devuelve uno de los tres niveles', () => {
    for (const pwd of ['a', 'Casa2026', 'azul perro 99', 'P@ssw0rd!x']) {
      expect(['debil', 'intermedio', 'fuerte']).toContain(
        evaluatePasswordStrength(pwd),
      );
    }
  });
});
```

- [ ] **Step 2: Verificar que falla**

Run (desde `backend/`): `npm test -- password-strength`
Expected: FAIL — `Cannot find module './password-strength'`.

- [ ] **Step 3: Implementar** — `backend/src/auth/password-strength.ts`

```typescript
import zxcvbn = require('zxcvbn');

export type PasswordStrength = 'debil' | 'intermedio' | 'fuerte';

// score zxcvbn: 0-4. 0-1 = débil, 2 = intermedio, 3-4 = fuerte
export function evaluatePasswordStrength(password: string): PasswordStrength {
  const { score } = zxcvbn(password);
  if (score <= 1) return 'debil';
  if (score === 2) return 'intermedio';
  return 'fuerte';
}
```

- [ ] **Step 4: Verificar que pasa**

Run (desde `backend/`): `npm test -- password-strength`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/auth/password-strength.ts backend/src/auth/password-strength.spec.ts
git commit -m "feat(backend): clasificación de fuerza de contraseña con zxcvbn"
```

---

### Task 6: Parser de navegador para el log de accesos (TDD)

**Files:**
- Create: `backend/src/access-logs/browser-parser.ts`
- Test: `backend/src/access-logs/browser-parser.spec.ts`

- [ ] **Step 1: Escribir el test que falla** — `backend/src/access-logs/browser-parser.spec.ts`

```typescript
import { parseBrowser } from './browser-parser';

describe('parseBrowser', () => {
  it('detecta Chrome', () => {
    expect(
      parseBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      ),
    ).toBe('Chrome');
  });

  it('detecta Edge (antes que Chrome, porque su UA contiene Chrome)', () => {
    expect(
      parseBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
      ),
    ).toBe('Edge');
  });

  it('detecta Firefox', () => {
    expect(
      parseBrowser('Mozilla/5.0 (Windows NT 10.0; rv:126.0) Gecko/20100101 Firefox/126.0'),
    ).toBe('Firefox');
  });

  it('devuelve Desconocido para cadenas vacías o raras', () => {
    expect(parseBrowser('')).toBe('Desconocido');
    expect(parseBrowser('curl/8.0')).toBe('Desconocido');
  });
});
```

- [ ] **Step 2: Verificar que falla**

Run (desde `backend/`): `npm test -- browser-parser`
Expected: FAIL — `Cannot find module './browser-parser'`.

- [ ] **Step 3: Implementar** — `backend/src/access-logs/browser-parser.ts`

```typescript
// El orden importa: el UA de Edge/Opera contiene "Chrome", y el de Chrome contiene "Safari"
const RULES: Array<[string, RegExp]> = [
  ['Edge', /Edg\//],
  ['Opera', /OPR\//],
  ['Chrome', /Chrome\//],
  ['Firefox', /Firefox\//],
  ['Safari', /Safari\//],
];

export function parseBrowser(userAgent: string): string {
  if (!userAgent) return 'Desconocido';
  for (const [name, pattern] of RULES) {
    if (pattern.test(userAgent)) return name;
  }
  return 'Desconocido';
}
```

- [ ] **Step 4: Verificar que pasa**

Run (desde `backend/`): `npm test -- browser-parser`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/access-logs/browser-parser.ts backend/src/access-logs/browser-parser.spec.ts
git commit -m "feat(backend): parser de navegador a partir del user-agent"
```

---

### Task 7: Módulo de logs de acceso (entidad + servicio)

**Files:**
- Create: `backend/src/access-logs/access-log.entity.ts`
- Create: `backend/src/access-logs/access-logs.service.ts`
- Create: `backend/src/access-logs/access-logs.module.ts`
- Modify: `backend/src/app.module.ts` (importar AccessLogsModule)

- [ ] **Step 1: Crear `backend/src/access-logs/access-log.entity.ts`**

```typescript
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum AccessEvent {
  INGRESO = 'INGRESO',
  SALIDA = 'SALIDA',
}

// Auditoría inmutable: sin borrado lógico a propósito
@Entity('access_logs')
export class AccessLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column()
  ip: string;

  @Column({ type: 'enum', enum: AccessEvent })
  event: AccessEvent;

  @Column()
  browser: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

- [ ] **Step 2: Crear `backend/src/access-logs/access-logs.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessEvent, AccessLog } from './access-log.entity';
import { parseBrowser } from './browser-parser';

@Injectable()
export class AccessLogsService {
  constructor(
    @InjectRepository(AccessLog) private readonly repo: Repository<AccessLog>,
  ) {}

  async record(
    userId: number,
    event: AccessEvent,
    ip: string,
    userAgent: string,
  ): Promise<AccessLog> {
    const log = this.repo.create({
      userId,
      event,
      ip,
      browser: parseBrowser(userAgent),
    });
    return this.repo.save(log);
  }

  findAll(): Promise<AccessLog[]> {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: 200 });
  }
}
```

- [ ] **Step 3: Crear `backend/src/access-logs/access-logs.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessLog } from './access-log.entity';
import { AccessLogsService } from './access-logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([AccessLog])],
  providers: [AccessLogsService],
  exports: [AccessLogsService],
})
export class AccessLogsModule {}
```

(El controlador con el endpoint para el Admin se agrega en la Task 10, cuando ya existan los guards de roles.)

- [ ] **Step 4: Registrar en `backend/src/app.module.ts`**

```typescript
import { AccessLogsModule } from './access-logs/access-logs.module';
// ...
  imports: [
    // ... como estaba ...
    UsersModule,
    AccessLogsModule,
  ],
```

- [ ] **Step 5: Verificar que compila y arranca**

Run (desde `backend/`): `npm run start:dev` (detener tras verificar)
Expected: arranca sin errores; tabla `access_logs` creada.

- [ ] **Step 6: Commit**

```bash
git add backend/src/access-logs backend/src/app.module.ts
git commit -m "feat(backend): entidad y servicio de logs de acceso"
```

---

### Task 8: Servicio de verificación de reCAPTCHA (TDD)

**Files:**
- Create: `backend/src/auth/captcha.service.ts`
- Test: `backend/src/auth/captcha.service.spec.ts`

- [ ] **Step 1: Escribir el test que falla** — `backend/src/auth/captcha.service.spec.ts`

```typescript
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
```

- [ ] **Step 2: Verificar que falla**

Run (desde `backend/`): `npm test -- captcha`
Expected: FAIL — `Cannot find module './captcha.service'`.

- [ ] **Step 3: Implementar** — `backend/src/auth/captcha.service.ts`

```typescript
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
```

- [ ] **Step 4: Verificar que pasa**

Run (desde `backend/`): `npm test -- captcha`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/auth/captcha.service.ts backend/src/auth/captcha.service.spec.ts
git commit -m "feat(backend): verificación de reCAPTCHA v2 contra la API de Google"
```

---

### Task 9: Módulo de autenticación (registro, login, logout, JWT, guards)

**Files:**
- Create: `backend/src/auth/dto/register.dto.ts`
- Create: `backend/src/auth/dto/login.dto.ts`
- Create: `backend/src/auth/decorators/public.decorator.ts`
- Create: `backend/src/auth/decorators/roles.decorator.ts`
- Create: `backend/src/auth/decorators/current-user.decorator.ts`
- Create: `backend/src/auth/jwt.strategy.ts`
- Create: `backend/src/auth/guards/jwt-auth.guard.ts`
- Create: `backend/src/auth/guards/roles.guard.ts`
- Create: `backend/src/common/client-ip.ts`
- Create: `backend/src/auth/auth.service.ts`
- Create: `backend/src/auth/auth.controller.ts`
- Create: `backend/src/auth/auth.module.ts`
- Test: `backend/src/auth/auth.service.spec.ts`
- Modify: `backend/src/app.module.ts` (importar AuthModule)

- [ ] **Step 1: DTOs con validaciones** — `backend/src/auth/dto/register.dto.ts`

```typescript
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(80, { message: 'El nombre no puede superar 80 caracteres' })
  name: string;

  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La contraseña no puede superar 72 caracteres' })
  password: string;
}
```

`backend/src/auth/dto/login.dto.ts`:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Ingrese su contraseña' })
  password: string;

  @IsString()
  captchaToken: string;
}
```

- [ ] **Step 2: Decoradores** — `backend/src/auth/decorators/public.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

`backend/src/auth/decorators/roles.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

`backend/src/auth/decorators/current-user.decorator.ts`:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../users/user.entity';

export interface AuthUser {
  userId: number;
  email: string;
  name: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest().user,
);
```

- [ ] **Step 3: Estrategia JWT** — `backend/src/auth/jwt.strategy.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '../users/user.entity';
import { AuthUser } from './decorators/current-user.decorator';

interface JwtPayload {
  sub: number;
  email: string;
  name: string;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  }
}
```

- [ ] **Step 4: Guards** — `backend/src/auth/guards/jwt-auth.guard.ts`

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

`backend/src/auth/guards/roles.guard.ts`:

```typescript
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const { user } = context.switchToHttp().getRequest();
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException('No tiene permisos para esta operación');
    }
    return true;
  }
}
```

- [ ] **Step 5: Helper de IP** — `backend/src/common/client-ip.ts`

```typescript
import { Request } from 'express';

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip ?? 'desconocida';
}
```

- [ ] **Step 6: Test del servicio (falla primero)** — `backend/src/auth/auth.service.spec.ts`

```typescript
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService.register', () => {
  const usersMock = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };
  const service = new AuthService(
    usersMock as any,
    {} as any, // CaptchaService (no se usa en register)
    {} as any, // JwtService (no se usa en register)
    {} as any, // AccessLogsService (no se usa en register)
  );

  beforeEach(() => jest.resetAllMocks());

  it('rechaza contraseñas débiles', async () => {
    usersMock.findByEmail.mockResolvedValue(null);
    await expect(
      service.register({ name: 'Ana Pérez', email: 'ana@test.com', password: 'abc12345' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza emails duplicados', async () => {
    usersMock.findByEmail.mockResolvedValue({ id: 1 });
    await expect(
      service.register({ name: 'Ana Pérez', email: 'ana@test.com', password: 'xK#9$mQ2&vL7' }),
    ).rejects.toThrow(ConflictException);
  });

  it('crea el usuario con hash y no devuelve la contraseña', async () => {
    usersMock.findByEmail.mockResolvedValue(null);
    usersMock.create.mockImplementation(async (data: any) => ({
      id: 7,
      role: 'RECEPCIONISTA',
      ...data,
    }));
    const result = await service.register({
      name: 'Ana Pérez',
      email: 'ana@test.com',
      password: 'xK#9$mQ2&vL7',
    });
    expect(usersMock.create).toHaveBeenCalled();
    const saved = usersMock.create.mock.calls[0][0];
    expect(saved.passwordHash).toBeDefined();
    expect(saved.passwordHash).not.toBe('xK#9$mQ2&vL7');
    expect(JSON.stringify(result)).not.toContain('passwordHash');
    expect(result).toMatchObject({ id: 7, email: 'ana@test.com' });
  });
});
```

- [ ] **Step 7: Verificar que falla**

Run (desde `backend/`): `npm test -- auth.service`
Expected: FAIL — `Cannot find module './auth.service'`.

- [ ] **Step 8: Implementar el servicio** — `backend/src/auth/auth.service.ts`

```typescript
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
```

- [ ] **Step 9: Verificar que el test pasa**

Run (desde `backend/`): `npm test -- auth.service`
Expected: PASS (3 tests).

- [ ] **Step 10: Controlador** — `backend/src/auth/auth.controller.ts`

```typescript
import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { getClientIp } from '../common/client-ip';
import { AuthService } from './auth.service';
import { AuthUser, CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, getClientIp(req), req.headers['user-agent'] ?? '');
  }

  @Post('logout')
  @HttpCode(200)
  logout(@CurrentUser() user: AuthUser, @Req() req: Request) {
    return this.auth.logout(user.userId, getClientIp(req), req.headers['user-agent'] ?? '');
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
```

- [ ] **Step 11: Módulo con guards globales** — `backend/src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AccessLogsModule } from '../access-logs/access-logs.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule,
    AccessLogsModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES', '8h') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    CaptchaService,
    JwtStrategy,
    // Guards globales: todo endpoint exige JWT salvo @Public(); @Roles() restringe por rol
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
```

- [ ] **Step 12: Registrar en `backend/src/app.module.ts`**

```typescript
import { AuthModule } from './auth/auth.module';
// ...
  imports: [
    // ... como estaba ...
    UsersModule,
    AccessLogsModule,
    AuthModule,
  ],
```

- [ ] **Step 13: Verificación manual del flujo (con la BD y el server corriendo)**

Run (desde `backend/`): `npm run start:dev` en una terminal; en otra (Bash):

```bash
# Login del admin (las claves de prueba de reCAPTCHA aceptan cualquier token)
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@medicitas.com","password":"Admin#2026!","captchaToken":"test"}'
```

Expected: JSON con `accessToken` y `user` con `"role":"ADMIN"`.

```bash
# Registro con contraseña débil → 400
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Usuario Prueba","email":"prueba@test.com","password":"abc12345"}'
```

Expected: `{"statusCode":400,...}` con el mensaje de contraseña débil.

```bash
# Endpoint protegido sin token → 401
curl -s http://localhost:3000/api/auth/me
```

Expected: `{"statusCode":401,...}`.

- [ ] **Step 14: Commit**

```bash
git add backend/src
git commit -m "feat(backend): autenticación JWT con captcha, registro validado, roles y log de ingreso/salida"
```

---

### Task 10: Endpoint de logs de acceso (solo Admin)

**Files:**
- Create: `backend/src/access-logs/access-logs.controller.ts`
- Modify: `backend/src/access-logs/access-logs.module.ts`

- [ ] **Step 1: Crear `backend/src/access-logs/access-logs.controller.ts`**

```typescript
import { Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { AccessLogsService } from './access-logs.service';

@Controller('access-logs')
export class AccessLogsController {
  constructor(private readonly logs: AccessLogsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.logs.findAll();
  }
}
```

- [ ] **Step 2: Registrar el controlador en `backend/src/access-logs/access-logs.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessLog } from './access-log.entity';
import { AccessLogsController } from './access-logs.controller';
import { AccessLogsService } from './access-logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([AccessLog])],
  controllers: [AccessLogsController],
  providers: [AccessLogsService],
  exports: [AccessLogsService],
})
export class AccessLogsModule {}
```

- [ ] **Step 3: Verificar con el token del admin (Bash, con el server corriendo)**

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@medicitas.com","password":"Admin#2026!","captchaToken":"test"}' \
  | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
curl -s http://localhost:3000/api/access-logs -H "Authorization: Bearer $TOKEN"
```

Expected: array JSON con al menos un registro `"event":"INGRESO"` con `ip`, `browser` y `user` (sin `passwordHash`).

- [ ] **Step 4: Commit**

```bash
git add backend/src/access-logs
git commit -m "feat(backend): consulta de logs de acceso restringida al rol ADMIN"
```

---

### Task 11: Scaffold del frontend React

**Files:**
- Create: `frontend/` (scaffold de Vite)
- Modify: `frontend/vite.config.ts`
- Create: `frontend/.env`
- Create: `frontend/.env.example`
- Create: `frontend/src/theme.ts`

- [ ] **Step 1: Generar el proyecto**

Run (desde la raíz): `npm create vite@latest frontend -- --template react-ts`
Luego (desde `frontend/`): `npm install`

- [ ] **Step 2: Instalar dependencias**

Run (desde `frontend/`):

```bash
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material react-router-dom axios react-hook-form zod @hookform/resolvers zxcvbn react-google-recaptcha
npm install -D @types/zxcvbn @types/react-google-recaptcha
```

- [ ] **Step 3: Configurar proxy en `frontend/vite.config.ts`** (reemplazar)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
```

- [ ] **Step 4: Variables de entorno** — `frontend/.env.example` y copiar a `frontend/.env`

```env
# Clave de PRUEBA de reCAPTCHA v2 (siempre valida; cambiar en producción)
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
# En producción apunta al backend desplegado; en desarrollo se usa el proxy /api
# VITE_API_URL=https://mi-backend.onrender.com/api
```

- [ ] **Step 5: Tema MUI** — `frontend/src/theme.ts`

```typescript
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#00796b' },
    secondary: { main: '#0288d1' },
    background: { default: '#f4f6f8' },
  },
  shape: { borderRadius: 8 },
});
```

- [ ] **Step 6: Limpiar el scaffold**

Eliminar `frontend/src/App.css` y `frontend/src/assets/react.svg`; vaciar `frontend/src/index.css` dejando solo:

```css
html, body, #root {
  height: 100%;
  margin: 0;
}
```

- [ ] **Step 7: Verificar que arranca**

Run (desde `frontend/`): `npm run dev` (detener tras verificar)
Expected: Vite sirve en `http://localhost:5173` sin errores (la página aún muestra el contenido por defecto; se reemplaza en las tasks siguientes).

- [ ] **Step 8: Commit**

```bash
git add frontend
git commit -m "feat(frontend): scaffold React + Vite + TS con MUI y proxy al backend"
```

---

### Task 12: Cliente API, contexto de sesión y rutas protegidas

**Files:**
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/auth.ts`
- Create: `frontend/src/auth/AuthContext.tsx`
- Create: `frontend/src/auth/ProtectedRoute.tsx`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Cliente axios** — `frontend/src/api/client.ts`

```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401 && window.location.pathname !== '/login') {
    localStorage.removeItem('mc_token');
    localStorage.removeItem('mc_user');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});
```

- [ ] **Step 2: Servicio de autenticación** — `frontend/src/api/auth.ts`

```typescript
import { api } from './client';

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'RECEPCIONISTA';
}

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}

export const authApi = {
  login: (data: { email: string; password: string; captchaToken: string }) =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data).then((r) => r.data),

  logout: () => api.post('/auth/logout').then((r) => r.data),
};
```

- [ ] **Step 3: Contexto de sesión** — `frontend/src/auth/AuthContext.tsx`

```tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import { authApi, type SessionUser } from '../api/auth';

interface AuthContextValue {
  user: SessionUser | null;
  login: (data: { email: string; password: string; captchaToken: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    const raw = localStorage.getItem('mc_user');
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  });

  const login: AuthContextValue['login'] = async (data) => {
    const res = await authApi.login(data);
    localStorage.setItem('mc_token', res.accessToken);
    localStorage.setItem('mc_user', JSON.stringify(res.user));
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await authApi.logout(); // registra SALIDA en el log de accesos
    } catch {
      // la sesión local se cierra aunque el backend no responda
    }
    localStorage.removeItem('mc_token');
    localStorage.removeItem('mc_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
```

- [ ] **Step 4: Ruta protegida** — `frontend/src/auth/ProtectedRoute.tsx`

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
```

- [ ] **Step 5: Punto de entrada** — `frontend/src/main.tsx` (reemplazar)

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { theme } from './theme';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
```

- [ ] **Step 6: Rutas** — `frontend/src/App.tsx` (reemplazar; las páginas se crean en las tasks 13-15)

```tsx
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

(No compilará hasta crear las tres páginas en las tasks 13-15; el commit de esta task se hace junto con la Task 15.)

---

### Task 13: Página de Login con reCAPTCHA

**Files:**
- Create: `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: Crear `frontend/src/pages/LoginPage.tsx`**

```tsx
import { useRef, useState } from 'react';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '../auth/AuthContext';

const schema = z.object({
  email: z.string().email('El email no es válido'),
  password: z.string().min(1, 'Ingrese su contraseña'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const captchaRef = useRef<ReCAPTCHA>(null);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (data: FormData) => {
    setError('');
    const captchaToken = captchaRef.current?.getValue() ?? '';
    if (!captchaToken) {
      setError('Complete el CAPTCHA para continuar');
      return;
    }
    try {
      await login({ ...data, captchaToken });
      navigate('/');
    } catch (e) {
      captchaRef.current?.reset();
      setError(
        axios.isAxiosError(e)
          ? (e.response?.data?.message ?? 'Error al iniciar sesión')
          : 'Error al iniciar sesión',
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ width: 400, m: 2 }}>
        <CardContent>
          <Stack spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
            <Stack alignItems="center" spacing={1}>
              <LocalHospitalIcon color="primary" sx={{ fontSize: 48 }} />
              <Typography variant="h5">MediCitas</Typography>
              <Typography variant="body2" color="text.secondary">
                Inicie sesión para continuar
              </Typography>
            </Stack>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Email"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              label="Contraseña"
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ReCAPTCHA
                ref={captchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              />
            </Box>
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
            </Button>
            <Typography variant="body2" align="center">
              ¿No tiene cuenta?{' '}
              <Link component={RouterLink} to="/register">
                Regístrese
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
```

(La verificación visual se hace en la Task 15, cuando el proyecto vuelva a compilar completo.)

---

### Task 14: Página de Registro con medidor de fuerza

**Files:**
- Create: `frontend/src/components/PasswordStrengthMeter.tsx`
- Create: `frontend/src/pages/RegisterPage.tsx`

- [ ] **Step 1: Medidor de fuerza** — `frontend/src/components/PasswordStrengthMeter.tsx`

```tsx
import { Box, LinearProgress, Typography } from '@mui/material';
import zxcvbn from 'zxcvbn';

export type StrengthLabel = 'Débil' | 'Intermedia' | 'Fuerte';

// Misma escala que el backend: 0-1 débil, 2 intermedia, 3-4 fuerte
export function getStrength(password: string): { score: number; label: StrengthLabel } {
  const { score } = zxcvbn(password);
  if (score <= 1) return { score, label: 'Débil' };
  if (score === 2) return { score, label: 'Intermedia' };
  return { score, label: 'Fuerte' };
}

export default function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { score, label } = getStrength(password);
  const color = label === 'Débil' ? 'error' : label === 'Intermedia' ? 'warning' : 'success';
  return (
    <Box>
      <LinearProgress
        variant="determinate"
        value={((score + 1) / 5) * 100}
        color={color}
        sx={{ height: 8, borderRadius: 4 }}
      />
      <Typography variant="caption" sx={{ color: `${color}.main` }}>
        Contraseña {label.toLowerCase()}
      </Typography>
    </Box>
  );
}
```

- [ ] **Step 2: Página de registro** — `frontend/src/pages/RegisterPage.tsx`

```tsx
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { authApi } from '../api/auth';
import PasswordStrengthMeter, { getStrength } from '../components/PasswordStrengthMeter';

const schema = z
  .object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    email: z.string().email('El email no es válido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'Las contraseñas no coinciden',
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const password = watch('password', '');
  const isWeak = password.length > 0 && getStrength(password).label === 'Débil';

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      navigate('/login');
    } catch (e) {
      setError(
        axios.isAxiosError(e)
          ? (e.response?.data?.message ?? 'Error al registrar el usuario')
          : 'Error al registrar el usuario',
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ width: 400, m: 2 }}>
        <CardContent>
          <Stack spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
            <Stack alignItems="center" spacing={1}>
              <PersonAddIcon color="primary" sx={{ fontSize: 48 }} />
              <Typography variant="h5">Crear cuenta</Typography>
            </Stack>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Nombre completo"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              label="Email"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              label="Contraseña"
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <PasswordStrengthMeter password={password} />
            <TextField
              label="Confirmar contraseña"
              type="password"
              {...register('confirm')}
              error={!!errors.confirm}
              helperText={errors.confirm?.message}
            />
            {isWeak && (
              <Alert severity="warning">
                La contraseña es débil: alárguela y combine mayúsculas, números y símbolos.
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting || isWeak}
            >
              {isSubmitting ? 'Registrando…' : 'Registrarse'}
            </Button>
            <Typography variant="body2" align="center">
              ¿Ya tiene cuenta?{' '}
              <Link component={RouterLink} to="/login">
                Inicie sesión
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
```

---

### Task 15: Dashboard provisional y verificación end-to-end

**Files:**
- Create: `frontend/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Crear `frontend/src/pages/DashboardPage.tsx`** (provisional; el layout con menú lateral llega en la Fase 2)

```tsx
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Toolbar,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../auth/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            MediCitas
          </Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
            Salir
          </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Bienvenido, {user?.name}
            </Typography>
            <Typography color="text.secondary">
              Rol: {user?.role === 'ADMIN' ? 'Administrador' : 'Recepcionista'}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Los módulos de pacientes, doctores y citas se habilitan en la Fase 2.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Verificar que compila**

Run (desde `frontend/`): `npm run build`
Expected: build sin errores de TypeScript.

- [ ] **Step 3: Verificación end-to-end manual**

Con la BD (`docker compose up -d db`), el backend (`npm run start:dev`) y el frontend (`npm run dev`) corriendo, en el navegador (`http://localhost:5173`):

1. Sin sesión, ir a `/` → redirige a `/login`.
2. En `/register`: probar contraseña `abc12345` → medidor en rojo "débil" y botón deshabilitado; con `Recep#2026!` → medidor verde, registro exitoso → redirige a login.
3. En `/login`: intentar sin marcar el CAPTCHA → mensaje "Complete el CAPTCHA"; marcar el CAPTCHA de prueba e ingresar con el usuario registrado → entra al dashboard con nombre y rol Recepcionista.
4. Pulsar "Salir" → vuelve al login.
5. Ingresar como `admin@medicitas.com` / `Admin#2026!` y verificar con Bash:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@medicitas.com","password":"Admin#2026!","captchaToken":"test"}' \
  | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
curl -s http://localhost:3000/api/access-logs -H "Authorization: Bearer $TOKEN"
```

Expected: registros INGRESO y SALIDA de los pasos anteriores, con IP, navegador (`Chrome`/`Edge`/`Firefox`) y datos del usuario.

- [ ] **Step 4: Ejecutar toda la suite de tests del backend**

Run (desde `backend/`): `npm test`
Expected: PASS — specs de password-strength, browser-parser, captcha y auth.service (el spec por defecto `app.controller.spec.ts` del scaffold también debe pasar).

- [ ] **Step 5: Commit final de la fase y push**

```bash
git add frontend
git commit -m "feat(frontend): login con captcha, registro con medidor de fuerza y dashboard inicial"
git push origin main
```

---

## Cobertura de requisitos de la Fase 1

| Requisito del spec | Task |
|---|---|
| Monorepo backend + frontend funcionando | 1, 2, 11 |
| PostgreSQL + TypeORM | 1, 3 |
| Entidad User con borrado lógico | 4 |
| Fuerza de contraseña (débil/intermedio/fuerte) + rechazo de débiles | 5, 9, 14 |
| Hash bcrypt | 4 (seed), 9 |
| reCAPTCHA v2 verificado en backend | 8, 9, 13 |
| Login JWT + roles ADMIN/RECEPCIONISTA + guards | 9 |
| Log de accesos (usuario, IP, evento, navegador, fecha/hora) | 6, 7, 9, 10 |
| Frontend: login, registro, sesión, rutas protegidas | 12, 13, 14, 15 |
