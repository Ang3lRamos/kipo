import { File } from 'expo-file-system';
import { deleteDatabaseAsync, openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { migrateDb } from './migrate';

// Fases 1 y 2 guardaban todo en kipo.db sin cifrar. Al abrir la base cifrada por primera vez
// se copian sus filas y se borra el archivo viejo. Es idempotente: si se interrumpe, se reintenta.

const legacyName = 'kipo.db';
const tables = ['documents', 'activity_log', 'document_pages'] as const;

function legacyPathNextTo(db: SQLiteDatabase): string {
  const dir = db.databasePath.slice(0, db.databasePath.lastIndexOf('/'));
  return `${dir}/${legacyName}`;
}

function legacyExists(path: string): boolean {
  return new File(path.startsWith('file://') ? path : `file://${path}`).exists;
}

export async function migrateLegacyDatabase(db: SQLiteDatabase): Promise<boolean> {
  const legacyPath = legacyPathNextTo(db);
  if (!legacyExists(legacyPath)) return false;

  // Lleva la base vieja al último esquema para que las columnas coincidan.
  const legacy = await openDatabaseAsync(legacyName);
  await migrateDb(legacy);
  await legacy.closeAsync();

  const quoted = legacyPath.replace(/'/g, "''");
  // KEY '' le indica a SQLCipher que la base adjunta no está cifrada.
  await db.execAsync(`ATTACH DATABASE '${quoted}' AS legacy KEY ''`);
  try {
    await db.withTransactionAsync(async () => {
      for (const table of tables) {
        // Los triggers de documents llenan el índice FTS5 de la base nueva.
        await db.execAsync(`INSERT OR IGNORE INTO main.${table} SELECT * FROM legacy.${table}`);
      }
    });
  } finally {
    await db.execAsync('DETACH DATABASE legacy');
  }
  await deleteDatabaseAsync(legacyName);
  return true;
}
