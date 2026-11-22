import type { SQLiteDatabase } from 'expo-sqlite';

import type { Subkeys } from '@/crypto/subkeys';
import { migrateLegacyDatabase } from '@/db/migrate-legacy';
import { unlockDatabase } from '@/db/open-encrypted';
import { encryptLegacyFiles } from '@/files/migrate-legacy-files';

// Opciones de apertura de la base cifrada. useNewConnection evita que expo-sqlite reutilice
// una conexión en caché que ya recibió la llave: repetir PRAGMA key sobre una conexión usada
// la deja ilegible ("file is not a database").
export const vaultDbOptions = { useNewConnection: true } as const;

async function step<T>(name: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${name}: ${message}`, { cause: error });
  }
}

export async function initVaultDatabase(db: SQLiteDatabase, keys: Subkeys): Promise<void> {
  try {
    await step('Abrir la base cifrada', () => unlockDatabase(db, keys.dbKey));
  } catch (error) {
    // SQLiteProvider no cierra la base si onInit falla; se cierra aquí para no dejarla en caché.
    await db.closeAsync().catch(() => undefined);
    throw error;
  }

  // Datos sin cifrar de las fases 1 y 2. Si algo falla, la app abre igual con la base cifrada,
  // el archivo viejo se conserva y se reintenta en el próximo desbloqueo.
  try {
    const rows = await step('Copiar datos de kipo.db', () => migrateLegacyDatabase(db));
    const files = await step('Cifrar archivos viejos', () => encryptLegacyFiles(db, keys.fileKey));
    if (rows > 0 || files > 0) console.warn(`Migración: ${rows} filas y ${files} páginas cifradas`);
  } catch (error) {
    console.error('La migración de datos viejos falló; se reintentará', error);
  }
}
