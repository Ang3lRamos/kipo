import type { SQLiteDatabase } from 'expo-sqlite';

import { migration001 } from './migrations/001-initial';

// Orden de aplicación. La versión de cada migración es su posición + 1.
const migrations: readonly string[] = [migration001];

export async function migrateDb(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current + 1; version <= migrations.length; version++) {
    const sql = migrations[version - 1];
    if (sql === undefined) break;
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(sql);
      await txn.execAsync(`PRAGMA user_version = ${version}`);
    });
  }
}
