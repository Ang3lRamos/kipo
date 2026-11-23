import type { SQLiteDatabase } from 'expo-sqlite';

import { rowToDocument, type DocumentRow } from '@/db/document-mapper';
import { getSetting, setSetting } from '@/db/settings-repo';
import type { DocumentRecord } from '@/types/document';

import type { SyncCursor } from './cloud-api';

// Estado de sincronización en la base local. La "cola offline" es el propio estado de cada
// fila: un documento con updated_at > synced_at está pendiente de subir.

export async function pendingDocuments(db: SQLiteDatabase): Promise<DocumentRecord[]> {
  const rows = await db.getAllAsync<DocumentRow>(
    'SELECT * FROM documents WHERE synced_at IS NULL OR updated_at > synced_at ORDER BY updated_at',
  );
  return rows.map(rowToDocument);
}

export async function countPending(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT count(*) AS n FROM documents WHERE synced_at IS NULL OR updated_at > synced_at',
  );
  return row?.n ?? 0;
}

type PageIdRow = { id: string };

export async function pagesToUpload(db: SQLiteDatabase, documentId: string): Promise<string[]> {
  const rows = await db.getAllAsync<PageIdRow>(
    'SELECT id FROM document_pages WHERE document_id = ? AND deleted_at IS NULL AND synced_at IS NULL',
    documentId,
  );
  return rows.map((r) => r.id);
}

export async function markPageSynced(db: SQLiteDatabase, pageId: string): Promise<void> {
  await db.runAsync(
    'UPDATE document_pages SET synced_at = ? WHERE id = ?',
    new Date().toISOString(),
    pageId,
  );
}

// Solo marca si el documento no cambió mientras se subía (si cambió, sigue pendiente).
export async function markDocumentSynced(
  db: SQLiteDatabase,
  id: string,
  updatedAt: string,
): Promise<void> {
  await db.runAsync(
    'UPDATE documents SET synced_at = ?2 WHERE id = ?1 AND updated_at = ?2',
    id,
    updatedAt,
  );
}

export async function localUpdatedAt(db: SQLiteDatabase, id: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ updated_at: string }>(
    'SELECT updated_at FROM documents WHERE id = ?',
    id,
  );
  return row?.updated_at ?? null;
}

export async function localPageIds(db: SQLiteDatabase, documentId: string): Promise<Set<string>> {
  const rows = await db.getAllAsync<PageIdRow>(
    'SELECT id FROM document_pages WHERE document_id = ? AND deleted_at IS NULL',
    documentId,
  );
  return new Set(rows.map((r) => r.id));
}

const cursorKey = 'sync_cursor';
const lastSyncKey = 'last_sync_at';
const vaultDirtyKey = 'vault_dirty';

export async function loadCursor(db: SQLiteDatabase): Promise<SyncCursor | null> {
  const raw = await getSetting(db, cursorKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SyncCursor>;
    return typeof parsed.at === 'string' && typeof parsed.id === 'string'
      ? { at: parsed.at, id: parsed.id }
      : null;
  } catch {
    return null;
  }
}

export const saveCursor = (db: SQLiteDatabase, cursor: SyncCursor) =>
  setSetting(db, cursorKey, JSON.stringify(cursor));

export const loadLastSync = (db: SQLiteDatabase) => getSetting(db, lastSyncKey);
export const saveLastSync = (db: SQLiteDatabase) =>
  setSetting(db, lastSyncKey, new Date().toISOString());

// La bóveda cambió (contraseña nueva) y hay que subir el registro.
export const markVaultChanged = (db: SQLiteDatabase) => setSetting(db, vaultDirtyKey, '1');
export const clearVaultChanged = (db: SQLiteDatabase) => setSetting(db, vaultDirtyKey, '0');
export const isVaultChanged = async (db: SQLiteDatabase) =>
  (await getSetting(db, vaultDirtyKey)) === '1';
