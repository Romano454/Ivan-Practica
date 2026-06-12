import zxcvbn = require('zxcvbn');

export type PasswordStrength = 'debil' | 'intermedio' | 'fuerte';

// score zxcvbn: 0-4. 0-1 = débil, 2 = intermedio, 3-4 = fuerte
export function evaluatePasswordStrength(password: string): PasswordStrength {
  const { score } = zxcvbn(password);
  if (score <= 1) return 'debil';
  if (score === 2) return 'intermedio';
  return 'fuerte';
}
