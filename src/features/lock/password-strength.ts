// Medidor sencillo para la contraseña maestra. No reemplaza a un estimador completo como
// zxcvbn, pero empuja hacia frases largas, que son lo más seguro y fácil de recordar.

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string; hint: string };

export const minAcceptableScore = 3;
const minLength = 12;

const commonFragments = [
  'contraseña',
  'contrasena',
  'password',
  'clave',
  '123456',
  'qwerty',
  'abc123',
  'kipo',
  'admin',
];

const labels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Excelente'] as const;

function estimateBits(password: string): number {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^\p{L}\p{N}\s]/u.test(password)) pool += 33;
  if (/[^\x00-\x7F]/.test(password)) pool += 20;
  if (/\s/.test(password)) pool += 1;
  return [...password].length * Math.log2(Math.max(pool, 1));
}

function scoreFromBits(bits: number): Strength['score'] {
  if (bits < 50) return 1;
  if (bits < 65) return 2;
  if (bits < 80) return 3;
  return 4;
}

export function rateMasterPassword(password: string): Strength {
  const length = [...password].length;
  const lower = password.toLowerCase();
  let score: Strength['score'] = length === 0 ? 0 : scoreFromBits(estimateBits(password));
  let hint = 'Una frase de 4 o más palabras al azar es fuerte y fácil de recordar.';

  if (length < minLength) {
    score = Math.min(score, 1) as Strength['score'];
    hint = `Usa al menos ${minLength} caracteres.`;
  } else if (commonFragments.some((fragment) => lower.includes(fragment))) {
    score = Math.min(score, 1) as Strength['score'];
    hint = 'Evita palabras y secuencias comunes como "contraseña" o "123456".';
  } else if (new Set(lower).size < 6) {
    score = Math.min(score, 1) as Strength['score'];
    hint = 'Tiene muy pocos caracteres distintos.';
  } else if (score >= minAcceptableScore) {
    hint = score === 4 ? 'Muy buena contraseña.' : 'Aceptable. Más largo es mejor.';
  }

  return { score, label: labels[score], hint };
}
