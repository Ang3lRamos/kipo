import type { SQLiteDatabase } from 'expo-sqlite';

import { migration001 } from './migrations/001-initial';
import { migration002 } from './migrations/002-document-pages';
import { migration003 } from './migrations/003-reminders';

// Orden de aplicación. La versión de cada migración es su posición + 1.
const migrations: readonly string[] = [migration001, migration002, migration003];

export async function migrateDb(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current + 1; version <= migrations.length; version++) {
    const sql = migrations[version - 1];
    if (sql === undefined) break;
    // withTransactionAsync usa esta misma conexión, que ya tiene la llave de SQLCipher.
    // No usar withExclusiveTransactionAsync: abre una conexión nueva sin llave y falla con
    // "file is not a database".
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${version}`);
    });
  }
}
