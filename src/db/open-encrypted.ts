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
  await db.execAsync(`PRAGMA key = "x'${bytesToHex(dbKey)}'"`);

  // Si este build no trae SQLCipher, PRAGMA key se ignora en silencio y la base quedaría en claro.
  const cipher = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
  if (!cipher?.cipher_version) throw new Error('Este build no tiene SQLCipher activo');

  try {
    // Si la llave no corresponde, esta lectura falla ("file is not a database").
    await db.getFirstAsync('SELECT count(*) AS n FROM sqlite_master');
  } catch (error) {
    // Diagnóstico sin datos sensibles: ¿la base era nueva o ya existía?
    const size = fileSize(db.databasePath);
    throw new Error(
      `la llave no abre vault.db (${size} bytes, SQLCipher ${cipher.cipher_version})`,
      {
        cause: error,
      },
    );
  }
  await migrateDb(db);
}
