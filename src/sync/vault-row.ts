import { parseVaultRecord, serializeVaultRecord, type VaultRecord } from '@/crypto/vault';

// Fila de la tabla vault_keys (supabase/migrations). Solo contiene datos ya cifrados:
// sin la contraseña maestra o la clave de recuperación no se puede obtener la DEK.

export type VaultRow = {
  wrapped_dek: string;
  wrapped_dek_recovery: string;
  kdf_salt: string;
  kdf_params: { alg: string; memoryKiB: number; passes: number; parallelism: number };
};

type Stored = {
  kdf: { alg: string; memoryKiB: number; passes: number; parallelism: number; salt: string };
  wrappedByPassword: string;
  wrappedByRecovery: string;
};

export function recordToRow(record: VaultRecord): VaultRow {
  const stored = JSON.parse(serializeVaultRecord(record)) as Stored;
  const { salt, ...params } = stored.kdf;
  return {
    wrapped_dek: stored.wrappedByPassword,
    wrapped_dek_recovery: stored.wrappedByRecovery,
    kdf_salt: salt,
    kdf_params: params,
  };
}

// Reutiliza la validación de parseVaultRecord: un registro mal formado se rechaza.
export function rowToRecord(row: VaultRow): VaultRecord {
  return parseVaultRecord(
    JSON.stringify({
      v: 1,
      kdf: { ...row.kdf_params, salt: row.kdf_salt },
      wrappedByPassword: row.wrapped_dek,
      wrappedByRecovery: row.wrapped_dek_recovery,
    }),
  );
}
