import { utf8, wipe } from './bytes';
import type { Argon2Cost, CryptoPrimitives } from './primitives';

// KEK = Argon2id(contraseña maestra, sal). Argon2id es resistente a GPUs y ASICs porque
// exige mucha memoria por intento. Los parámetros se guardan junto a la sal para poder
// subirlos en el futuro sin romper bóvedas viejas.

export type KdfParams = Argon2Cost & { alg: 'argon2id'; salt: Uint8Array };

export const defaultMemoryKiB = 64 * 1024; // 64 MiB por intento
const saltLength = 16;
const kekLength = 32;
const targetMs = 750; // PLAN.md: entre 0,5 y 1 segundo en el teléfono
const minPasses = 2;
const maxPasses = 10;

export function newKdfParams(
  crypto: CryptoPrimitives,
  passes: number,
  memoryKiB: number = defaultMemoryKiB,
  parallelism = 1,
): KdfParams {
  return { alg: 'argon2id', memoryKiB, passes, parallelism, salt: crypto.randomBytes(saltLength) };
}

export async function deriveKek(
  crypto: CryptoPrimitives,
  password: string,
  params: KdfParams,
): Promise<Uint8Array> {
  if (password.length === 0) throw new Error('La contraseña no puede estar vacía');
  // NFKC: la misma contraseña escrita en teclados distintos produce los mismos bytes.
  const passwordBytes = utf8(password.normalize('NFKC'));
  try {
    return await crypto.argon2id(passwordBytes, params.salt, params, kekLength);
  } finally {
    wipe(passwordBytes);
  }
}

export function choosePasses(msPerPass: number): number {
  const passes = Math.round(targetMs / Math.max(1, msPerPass));
  return Math.min(maxPasses, Math.max(minPasses, passes));
}

// Mide cuánto tarda una pasada en este teléfono y elige cuántas hacer.
export async function calibratePasses(
  crypto: CryptoPrimitives,
  now: () => number = Date.now,
): Promise<number> {
  const sample = newKdfParams(crypto, 1);
  const start = now();
  const key = await crypto.argon2id(utf8('calibracion'), sample.salt, sample, kekLength);
  wipe(key);
  return choosePasses(now() - start);
}
