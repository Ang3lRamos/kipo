import { open, seal } from './aead';
import { fromBase64, toBase64, wipe } from './bytes';
import { DecryptionError, WrongPasswordError, WrongRecoveryKeyError } from './errors';
import { deriveKek, newKdfParams, type KdfParams } from './kdf';
import type { Argon2Cost, CryptoPrimitives } from './primitives';
import { generateRecoveryKey, parseRecoveryKey } from './recovery-key';
import { hkdfSha256 } from './subkeys';

// Jerarquía de claves (PLAN.md, fase 3):
//   contraseña ──Argon2id──► KEK ──envuelve──► DEK (32 bytes aleatorios, cifra todo)
//   clave de recuperación ──HKDF──► llave de recuperación ──envuelve──► la misma DEK
// Cambiar la contraseña solo vuelve a envolver la DEK; los archivos no se re-cifran.

export type VaultRecord = {
  v: 1;
  kdf: KdfParams;
  wrappedByPassword: Uint8Array;
  wrappedByRecovery: Uint8Array;
};

const dekLength = 32;
const passwordAad = 'kipo/dek-wrap/password/v1';
const recoveryAad = 'kipo/dek-wrap/recovery/v1';

function recoveryWrapKey(recoveryKey: Uint8Array): Uint8Array {
  return hkdfSha256(recoveryKey, 'kipo/recovery-wrap/v1');
}

async function wrapWithPassword(
  crypto: CryptoPrimitives,
  dek: Uint8Array,
  password: string,
  kdf: KdfParams,
): Promise<Uint8Array> {
  const kek = await deriveKek(crypto, password, kdf);
  try {
    return seal(crypto, kek, dek, passwordAad);
  } finally {
    wipe(kek);
  }
}

export async function createVault(crypto: CryptoPrimitives, password: string, cost: Argon2Cost) {
  const dek = crypto.randomBytes(dekLength);
  const recoveryKey = generateRecoveryKey(crypto);
  const kdf = newKdfParams(crypto, cost.passes, cost.memoryKiB, cost.parallelism);
  const wrapKey = recoveryWrapKey(recoveryKey);
  const record: VaultRecord = {
    v: 1,
    kdf,
    wrappedByPassword: await wrapWithPassword(crypto, dek, password, kdf),
    wrappedByRecovery: seal(crypto, wrapKey, dek, recoveryAad),
  };
  wipe(wrapKey);
  return { record, dek, recoveryKey };
}

export async function unlockWithPassword(
  crypto: CryptoPrimitives,
  record: VaultRecord,
  password: string,
): Promise<Uint8Array> {
  const kek = await deriveKek(crypto, password, record.kdf);
  try {
    return open(crypto, kek, record.wrappedByPassword, passwordAad);
  } catch (error) {
    throw error instanceof DecryptionError ? new WrongPasswordError() : error;
  } finally {
    wipe(kek);
  }
}

// Lanza InvalidRecoveryKeyError si el texto está mal escrito y WrongRecoveryKeyError si es
// una clave válida pero de otra bóveda.
export function unlockWithRecoveryKey(
  crypto: CryptoPrimitives,
  record: VaultRecord,
  recoveryKeyText: string,
): Uint8Array {
  const recoveryKey = parseRecoveryKey(recoveryKeyText);
  const wrapKey = recoveryWrapKey(recoveryKey);
  try {
    return open(crypto, wrapKey, record.wrappedByRecovery, recoveryAad);
  } catch (error) {
    throw error instanceof DecryptionError ? new WrongRecoveryKeyError() : error;
  } finally {
    wipe(recoveryKey, wrapKey);
  }
}

// También sirve para restablecer la contraseña después de desbloquear con la clave de recuperación.
export async function changePassword(
  crypto: CryptoPrimitives,
  record: VaultRecord,
  dek: Uint8Array,
  newPassword: string,
  cost: Argon2Cost,
): Promise<VaultRecord> {
  const kdf = newKdfParams(crypto, cost.passes, cost.memoryKiB, cost.parallelism);
  return {
    ...record,
    kdf,
    wrappedByPassword: await wrapWithPassword(crypto, dek, newPassword, kdf),
  };
}

export function serializeVaultRecord(record: VaultRecord): string {
  return JSON.stringify({
    ...record,
    kdf: { ...record.kdf, salt: toBase64(record.kdf.salt) },
    wrappedByPassword: toBase64(record.wrappedByPassword),
    wrappedByRecovery: toBase64(record.wrappedByRecovery),
  });
}

type StoredRecord = {
  v: number;
  kdf: Omit<KdfParams, 'salt'> & { salt: string };
  wrappedByPassword: string;
  wrappedByRecovery: string;
};

function isStoredRecord(value: unknown): value is StoredRecord {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Partial<StoredRecord>;
  return (
    r.v === 1 &&
    r.kdf?.alg === 'argon2id' &&
    typeof r.kdf.salt === 'string' &&
    Number.isInteger(r.kdf.memoryKiB) &&
    Number.isInteger(r.kdf.passes) &&
    Number.isInteger(r.kdf.parallelism) &&
    typeof r.wrappedByPassword === 'string' &&
    typeof r.wrappedByRecovery === 'string'
  );
}

export function parseVaultRecord(json: string): VaultRecord {
  const value: unknown = JSON.parse(json);
  if (!isStoredRecord(value)) throw new Error('Registro de bóveda con formato desconocido');
  return {
    v: 1,
    kdf: { ...value.kdf, salt: fromBase64(value.kdf.salt) },
    wrappedByPassword: fromBase64(value.wrappedByPassword),
    wrappedByRecovery: fromBase64(value.wrappedByRecovery),
  };
}
