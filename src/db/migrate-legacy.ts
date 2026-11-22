import { File } from 'expo-file-system';
import {
  deleteDatabaseAsync,
  openDatabaseAsync,
  type SQLiteBindValue,
  type SQLiteDatabase,
} from 'expo-sqlite';

import { migrateDb } from './migrate';

// Fases 1 y 2 guardaban todo en kipo.db sin cifrar. Al abrir la base cifrada se copian sus
// filas y se borra el archivo viejo. Se copia fila por fila desde JS (no con ATTACH) para no
// depender de cómo SQLCipher adjunta bases sin cifrar. Es idempotente: si falla, se reintenta.

const legacyName = 'kipo.db';
const tables = ['documents', 'activity_log', 'document_pages'] as const;
type Row = Record<string, SQLiteBindValue>;

function legacyExists(db: SQLiteDatabase): boolean {
  const dir = db.databasePath.slice(0, db.databasePath.lastIndexOf('/'));
  const path = `${dir}/${legacyName}`;
  return new File(path.startsWith('file://') ? path : `file://${path}`).exists;
}

async function readLegacyRows(): Promise<Record<(typeof tables)[number], Row[]>> {
  // Conexión propia y sin caché: se cierra siempre, aunque algo falle.
  const legacy = await openDatabaseAsync(legacyName, { useNewConnection: true });
  try {
    await migrateDb(legacy); // lleva la base vieja al último esquema
    return {
      documents: await legacy.getAllAsync<Row>('SELECT * FROM documents'),
      activity_log: await legacy.getAllAsync<Row>('SELECT * FROM activity_log'),
      document_pages: await legacy.getAllAsync<Row>('SELECT * FROM document_pages'),
    };
  } finally {
    await legacy.closeAsync();
  }
}

export async function migrateLegacyDatabase(db: SQLiteDatabase): Promise<number> {
  if (!legacyExists(db)) return 0;
  const rows = await readLegacyRows();
  let copied = 0;

  await db.withTransactionAsync(async () => {
    for (const table of tables) {
      for (const row of rows[table]) {
        const columns = Object.keys(row);
        const placeholders = columns.map(() => '?').join(', ');
        // Los triggers de documents llenan el índice FTS5 de la base nueva.
        await db.runAsync(
          `INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
          columns.map((column) => row[column] ?? null),
        );
        copied++;
      }
    }
  });

  await deleteDatabaseAsync(legacyName);
  return copied;
}
