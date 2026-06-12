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
