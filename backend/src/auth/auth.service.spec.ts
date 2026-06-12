import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const usersMock = { findByEmail: jest.fn(), create: jest.fn() };
  const captchaMock = { verify: jest.fn() };
  const jwtMock = { signAsync: jest.fn() };
  const logsMock = { record: jest.fn() };
  const service = new AuthService(
    usersMock as any,
    captchaMock as any,
    jwtMock as any,
    logsMock as any,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    captchaMock.verify.mockResolvedValue(undefined);
    jwtMock.signAsync.mockResolvedValue('jwt-token');
  });

  describe('register', () => {
    const dto = {
      name: 'Ana Pérez',
      email: 'ana@test.com',
      password: 'xK#9$mQ2&vL7',
      captchaToken: 'token',
    };

    it('verifica el captcha antes de crear el usuario', async () => {
      captchaMock.verify.mockRejectedValue(new BadRequestException());
      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
      expect(usersMock.findByEmail).not.toHaveBeenCalled();
    });

    it('rechaza contraseñas débiles', async () => {
      usersMock.findByEmail.mockResolvedValue(null);
      await expect(
        service.register({ ...dto, password: 'abc12345' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza emails duplicados', async () => {
      usersMock.findByEmail.mockResolvedValue({ id: 1 });
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('crea el usuario con hash y no devuelve la contraseña', async () => {
      usersMock.findByEmail.mockResolvedValue(null);
      usersMock.create.mockImplementation(async (data: any) => ({
        id: 7,
        role: 'RECEPCIONISTA',
        ...data,
      }));
      const result = await service.register(dto);
      const saved = usersMock.create.mock.calls[0][0];
      expect(saved.passwordHash).toBeDefined();
      expect(saved.passwordHash).not.toBe(dto.password);
      expect(JSON.stringify(result)).not.toContain('passwordHash');
      expect(result).toMatchObject({ id: 7, email: 'ana@test.com' });
    });
  });

  describe('login', () => {
    const dto = { email: 'a@a.com', password: 'Secreta#2026', captchaToken: 't' };
    const buildUser = async () => ({
      id: 1,
      name: 'Admin',
      email: 'a@a.com',
      role: 'ADMIN',
      isActive: true,
      passwordHash: await bcrypt.hash('Secreta#2026', 10),
    });

    it('verifica el captcha antes de consultar credenciales', async () => {
      captchaMock.verify.mockRejectedValue(new UnauthorizedException());
      await expect(service.login(dto, 'ip', 'ua')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersMock.findByEmail).not.toHaveBeenCalled();
    });

    it('rechaza contraseñas incorrectas sin registrar ingreso', async () => {
      usersMock.findByEmail.mockResolvedValue(await buildUser());
      await expect(
        service.login({ ...dto, password: 'otra' }, 'ip', 'ua'),
      ).rejects.toThrow('Credenciales inválidas');
      expect(logsMock.record).not.toHaveBeenCalled();
    });

    it('rechaza usuarios inactivos sin registrar ingreso', async () => {
      usersMock.findByEmail.mockResolvedValue({
        ...(await buildUser()),
        isActive: false,
      });
      await expect(service.login(dto, 'ip', 'ua')).rejects.toThrow(
        'El usuario está inactivo',
      );
      expect(logsMock.record).not.toHaveBeenCalled();
    });

    it('registra INGRESO y devuelve token con credenciales válidas', async () => {
      usersMock.findByEmail.mockResolvedValue(await buildUser());
      const res = await service.login(dto, '1.2.3.4', 'Mozilla Chrome/1');
      expect(res.accessToken).toBe('jwt-token');
      expect(res.user).toMatchObject({ id: 1, role: 'ADMIN' });
      expect(logsMock.record).toHaveBeenCalledWith(
        1,
        'INGRESO',
        '1.2.3.4',
        'Mozilla Chrome/1',
      );
    });
  });
});
