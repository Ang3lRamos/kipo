import type { SQLiteDatabase } from 'expo-sqlite';

import type { Subkeys } from '@/crypto/subkeys';
import type { VaultRecord } from '@/crypto/vault';

import { applyRemoteDocument } from './apply-remote';
import { fetchChangesSince, fetchRemoteVault, pushVault } from './cloud-api';
import {
  clearVaultChanged,
  isVaultChanged,
  loadCursor,
  pendingDocuments,
  saveCursor,
  saveLastSync,
} from './local-sync-repo';
import { pushDocument } from './push-local';
import { pullSecrets, pushSecrets } from './secrets-sync';

// errors: motivo de cada fallo (para mostrarlo en la pantalla de respaldo).
export type SyncSummary = {
  downloaded: number;
  uploaded: number;
  failed: number;
  errors: string[];
};

const reason = (error: unknown) => (error instanceof Error ? error.message : String(error));

// La bóveda se sube si la nube no la tiene o si cambió la contraseña en este teléfono.
// Nunca se reemplaza la local con la de la nube (eso solo pasa al restaurar en un teléfono
// nuevo): así un servidor comprometido no puede cambiarte el registro de llaves.
async function syncVault(db: SQLiteDatabase, record: VaultRecord): Promise<void> {
  const remote = await fetchRemoteVault();
  if (!remote || (await isVaultChanged(db))) {
    await pushVault(record);
    await clearVaultChanged(db);
  }
}

async function pull(db: SQLiteDatabase, keys: Subkeys, summary: SyncSummary): Promise<void> {
  let cursor = await loadCursor(db);
  for (;;) {
    const rows = await fetchChangesSince(cursor);
    if (rows.length === 0) return;
    for (const row of rows) {
      try {
        if ((await applyRemoteDocument(db, keys, row)) === 'applied') summary.downloaded++;
      } catch (error) {
        // Un documento dañado o sin red no detiene el resto; el cursor no avanza más allá
        // de él, así que se reintenta en la próxima sincronización.
        summary.failed++;
        summary.errors.push(`Bajar: ${reason(error)}`);
        console.warn('No se pudo aplicar un documento de la nube', error);
        return;
      }
      cursor = { at: row.server_updated_at, id: row.id };
      await saveCursor(db, cursor);
    }
  }
}

async function push(db: SQLiteDatabase, keys: Subkeys, summary: SyncSummary): Promise<void> {
  for (const doc of await pendingDocuments(db)) {
    try {
      await pushDocument(db, keys, doc);
      summary.uploaded++;
    } catch (error) {
      // Queda pendiente (updated_at > synced_at) y se reintenta después: cola offline.
      summary.failed++;
      summary.errors.push(`Subir "${doc.title}": ${reason(error)}`);
      console.warn('No se pudo subir un documento', error);
    }
  }
}

// Primero baja (para restaurar rápido en un teléfono nuevo) y luego sube lo pendiente.
export async function runSync(
  db: SQLiteDatabase,
  keys: Subkeys,
  record: VaultRecord,
): Promise<SyncSummary> {
  const summary: SyncSummary = { downloaded: 0, uploaded: 0, failed: 0, errors: [] };
  await syncVault(db, record);
  await pull(db, keys, summary);
  await pullSecrets(db, keys, summary);
  await push(db, keys, summary);
  await pushSecrets(db, keys, summary);
  if (summary.failed === 0) await saveLastSync(db);
  return summary;
}
