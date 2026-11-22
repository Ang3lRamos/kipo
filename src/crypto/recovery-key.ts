import { sha256 } from '@noble/hashes/sha2.js';
import { base32crockford } from '@scure/base';

import { concatBytes } from './bytes';
import { InvalidRecoveryKeyError } from './errors';
import type { CryptoPrimitives } from './primitives';

// Clave de recuperación: 160 bits aleatorios + 16 bits de suma de verificación, en base32
// de Crockford (sin letras confundibles). Se muestra como 9 grupos de 4: XXXX-XXXX-...
// Como es aleatoria y larga, no necesita Argon2: se convierte en llave con HKDF.

const keyLength = 20;
const checksumLength = 2;

function checksum(key: Uint8Array): Uint8Array {
  return sha256(key).subarray(0, checksumLength);
}

export function generateRecoveryKey(crypto: CryptoPrimitives): Uint8Array {
  return crypto.randomBytes(keyLength);
}

export function formatRecoveryKey(key: Uint8Array): string {
  const text = base32crockford.encode(concatBytes(key, checksum(key)));
  return text.match(/.{1,4}/g)?.join('-') ?? text;
}

export function parseRecoveryKey(text: string): Uint8Array {
  const normalized = text
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  let decoded: Uint8Array;
  try {
    decoded = base32crockford.decode(normalized);
  } catch {
    throw new InvalidRecoveryKeyError();
  }
  if (decoded.length !== keyLength + checksumLength) throw new InvalidRecoveryKeyError();
  const key = decoded.slice(0, keyLength);
  const expected = checksum(key);
  const given = decoded.subarray(keyLength);
  if (expected.some((byte, i) => byte !== given[i])) throw new InvalidRecoveryKeyError();
  return key;
}
