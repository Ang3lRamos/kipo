import { bytesToHex } from '@noble/hashes/utils.js';
import { File } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import { assertUsableKey } from '@/crypto/aead';

import { migrateDb } from './migrate';

export const vaultDbName = 'vault.db';

function fileSize(path: string): number {
  const file = new File(path.startsWith('file://') ? path : `file://${path}`);
  return file.exists ? file.size : 0;
}

// SQLCipher: la llave debe ser lo primero que se ejecuta al abrir la base. Se pasa como
// llave cruda en hexadecimal (x'...'), así SQLCipher no aplica su propia derivación PBKDF2:
// la llave ya viene de la DEK vía HKDF.
export async function unlockDatabase(db: SQLiteDatabase, dbKey: Uint8Array): Promise<void> {
  assertUsableKey(dbKey);
  // Diagnóstico sin datos sensibles: tamaño antes de tocar la base (0 = base nueva).
  const sizeBefore = fileSize(db.databasePath);
  let stage = 'PRAGMA key';
  try {
    await db.execAsync(`PRAGMA key = "x'${bytesToHex(dbKey)}'"`);

    // Si este build no trae SQLCipher, PRAGMA key se ignora en silencio y la base quedaría
    // en claro. (Esta consulta ya lee la cabecera: con otra llave falla aquí.)
    stage = 'PRAGMA cipher_version';
    const cipher = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
    if (!cipher?.cipher_version) throw new Error('este build no tiene SQLCipher activo');

    stage = 'leer sqlite_master';
    await db.getFirstAsync('SELECT count(*) AS n FROM sqlite_master');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${message} [paso: ${stage}; vault.db tenía ${sizeBefore} bytes]`, {
      cause: error,
    });
  }
  await migrateDb(db);
}
