import { randomBytes } from 'node:crypto';

import { defaultGenerator, generatePassword, generatorBits } from './password-generator';

const random = (size: number) => new Uint8Array(randomBytes(size));

describe('generador de contraseñas', () => {
  it('respeta la longitud e incluye cada tipo elegido', () => {
    for (let i = 0; i < 200; i++) {
      const password = generatePassword(random, defaultGenerator);
      expect(password).toHaveLength(20);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[0-9]/);
      expect(password).toMatch(/[!#$%&*+\-=?@^_~]/);
    }
  });

  it('evita caracteres confundibles por defecto', () => {
    const joined = Array.from({ length: 300 }, () =>
      generatePassword(random, defaultGenerator),
    ).join('');
    expect(joined).not.toMatch(/[0O1lI]/);
  });

  it('solo números (por ejemplo, un PIN)', () => {
    const pin = generatePassword(random, {
      ...defaultGenerator,
      length: 6,
      lowercase: false,
      uppercase: false,
      symbols: false,
    });
    expect(pin).toMatch(/^[2-9]{6}$/);
  });

  it('no repite contraseñas', () => {
    const many = new Set(
      Array.from({ length: 500 }, () => generatePassword(random, defaultGenerator)),
    );
    expect(many.size).toBe(500);
  });

  it('la distribución es pareja (sin sesgo por módulo)', () => {
    const counts = new Map<string, number>();
    const options = {
      ...defaultGenerator,
      length: 50,
      uppercase: false,
      symbols: false,
      digits: false,
    };
    for (let i = 0; i < 400; i++) {
      for (const c of generatePassword(random, options)) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    const values = [...counts.values()];
    // 25 letras, 20 000 caracteres: ~800 cada una. Ninguna debería alejarse más de 25 %.
    expect(Math.min(...values)).toBeGreaterThan(600);
    expect(Math.max(...values)).toBeLessThan(1000);
  });

  it('exige al menos un tipo y estima la fuerza', () => {
    expect(() =>
      generatePassword(random, {
        ...defaultGenerator,
        lowercase: false,
        uppercase: false,
        digits: false,
        symbols: false,
      }),
    ).toThrow();
    expect(generatorBits(defaultGenerator)).toBeGreaterThan(110);
  });
});
