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
