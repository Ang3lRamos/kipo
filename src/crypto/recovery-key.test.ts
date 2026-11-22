import { InvalidRecoveryKeyError } from './errors';
import { formatRecoveryKey, generateRecoveryKey, parseRecoveryKey } from './recovery-key';
import { nodePrimitives as crypto } from './testing/node-primitives';

describe('clave de recuperación', () => {
  it('tiene 160 bits aleatorios y se muestra en 9 grupos de 4', () => {
    const key = generateRecoveryKey(crypto);
    expect(key).toHaveLength(20);
    expect(formatRecoveryKey(key)).toMatch(/^([0-9A-HJKMNP-TV-Z]{4}-){8}[0-9A-HJKMNP-TV-Z]{4}$/);
  });

  it('ida y vuelta', () => {
    const key = generateRecoveryKey(crypto);
    expect(parseRecoveryKey(formatRecoveryKey(key))).toEqual(key);
  });

  it('tolera minúsculas, espacios y letras confundibles (O→0, I/L→1)', () => {
    const key = generateRecoveryKey(crypto);
    const text = formatRecoveryKey(key);
    const sloppy = text.toLowerCase().replace(/-/g, ' ').replace(/0/g, 'o').replace(/1/g, 'l');
    expect(parseRecoveryKey(`  ${sloppy} `)).toEqual(key);
  });

  it('detecta errores de digitación con la suma de verificación', () => {
    const text = formatRecoveryKey(generateRecoveryKey(crypto));
    const first = text[0] === 'A' ? 'B' : 'A';
    expect(() => parseRecoveryKey(first + text.slice(1))).toThrow(InvalidRecoveryKeyError);
    expect(() => parseRecoveryKey(text.slice(0, -5))).toThrow(InvalidRecoveryKeyError);
    expect(() => parseRecoveryKey('no-es-una-clave')).toThrow(InvalidRecoveryKeyError);
  });

  it('cada clave es distinta', () => {
    expect(generateRecoveryKey(crypto)).not.toEqual(generateRecoveryKey(crypto));
  });
});
