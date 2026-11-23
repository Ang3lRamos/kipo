// Generador de contraseñas con el CSPRNG del teléfono. Sin sesgo: los bytes que no caben
// exactamente en el alfabeto se descartan (muestreo por rechazo) en lugar de usar módulo.

export type GeneratorOptions = {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  digits: boolean;
  symbols: boolean;
  // Sin caracteres que se confunden al copiarlos a mano: 0/O, 1/l/I.
  avoidAmbiguous: boolean;
};

export const defaultGenerator: GeneratorOptions = {
  length: 20,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: true,
  avoidAmbiguous: true,
};

const sets = {
  lowercase: 'abcdefghijkmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  digits: '23456789',
  symbols: '!#$%&*+-=?@^_~',
};
const ambiguous = { lowercase: 'l', uppercase: 'IO', digits: '01' };

type RandomBytes = (size: number) => Uint8Array;

function alphabetFor(options: GeneratorOptions): string[] {
  const chosen: string[] = [];
  for (const key of ['lowercase', 'uppercase', 'digits', 'symbols'] as const) {
    if (!options[key]) continue;
    const extra = !options.avoidAmbiguous && key !== 'symbols' ? ambiguous[key] : '';
    chosen.push(sets[key] + extra);
  }
  return chosen;
}

// Un índice uniforme en [0, max) a partir de bytes aleatorios.
function uniformIndex(randomBytes: RandomBytes, max: number): number {
  const limit = 256 - (256 % max);
  for (;;) {
    for (const byte of randomBytes(16)) {
      if (byte < limit) return byte % max;
    }
  }
}

export function generatePassword(randomBytes: RandomBytes, options: GeneratorOptions): string {
  const groups = alphabetFor(options);
  if (groups.length === 0) throw new Error('Elige al menos un tipo de carácter');
  const length = Math.min(128, Math.max(groups.length, Math.round(options.length)));
  const all = groups.join('');
  const pick = (chars: string) => chars[uniformIndex(randomBytes, chars.length)] ?? '';

  // Uno de cada tipo elegido y el resto de todo el alfabeto; luego se mezcla (Fisher–Yates).
  const chars = [
    ...groups.map(pick),
    ...Array.from({ length: length - groups.length }, () => pick(all)),
  ];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = uniformIndex(randomBytes, i + 1);
    [chars[i], chars[j]] = [chars[j] ?? '', chars[i] ?? ''];
  }
  return chars.join('');
}

// Entropía aproximada en bits, para mostrar qué tan fuerte es.
export function generatorBits(options: GeneratorOptions): number {
  const size = alphabetFor(options).join('').length;
  return size > 0 ? Math.round(options.length * Math.log2(size)) : 0;
}
