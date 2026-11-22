import { bytesToHex } from '@noble/hashes/utils.js';
import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateDb } from './migrate';

export const vaultDbName = 'vault.db';

// SQLCipher: la llave debe ser lo primero que se ejecuta al abrir la base. Se pasa como
// llave cruda en hexadecimal (x'...'), así SQLCipher no aplica su propia derivación PBKDF2:
// la llave ya viene de la DEK vía HKDF.
export async function unlockDatabase(db: SQLiteDatabase, dbKey: Uint8Array): Promise<void> {
  await db.execAsync(`PRAGMA key = "x'${bytesToHex(dbKey)}'"`);
  // Si la llave no corresponde, esta lectura falla ("file is not a database").
  await db.getFirstAsync('SELECT count(*) AS n FROM sqlite_master');
  await migrateDb(db);
}
