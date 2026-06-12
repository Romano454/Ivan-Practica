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
