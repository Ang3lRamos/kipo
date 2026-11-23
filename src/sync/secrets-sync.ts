import type { SQLiteDatabase } from 'expo-sqlite';

import { nativePrimitives as crypto } from '@/crypto/native-primitives';
import { decryptPayload, encryptPayload } from '@/crypto/payload-crypto';
import type { Subkeys } from '@/crypto/subkeys';
import { getSetting, setSetting } from '@/db/settings-repo';
import { parseSecretData } from '@/secrets/secret-codec';
import { searchTextFor } from '@/secrets/secret-rules';

import { fetchChangesSince, upsertRemoteDocument, type SyncCursor } from './cloud-api';

// Sincronización de claves (fase 7): misma lógica que los documentos, en la tabla `secrets`.
// Lo que sube: { v, title, data, createdAt } cifrado con la llave de metadatos ("secret").

type Summary = { downloaded: number; uploaded: number; failed: number; errors: string[] };
type PendingRow = {
  id: string;
  title: string;
  data: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

const cursorKey = 'sync_cursor_secrets';
const reason = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function pushSecrets(db: SQLiteDatabase, keys: Subkeys, summary: Summary) {
  const rows = await db.getAllAsync<PendingRow>(
    `SELECT id, title, data, created_at, updated_at, deleted_at FROM secrets
     WHERE synced_at IS NULL OR updated_at > synced_at`,
  );
  for (const row of rows) {
    try {
      // Un borrado sube sin datos: solo la marca de borrado.
      const payload = row.deleted_at
        ? { v: 1, deleted: true }
        : {
            v: 1,
            title: row.title,
            data: JSON.parse(row.data) as unknown,
            createdAt: row.created_at,
          };
      const encoded = encryptPayload(crypto, keys.metaKey, row.id, payload, 'secret');
      await upsertRemoteDocument(row.id, encoded, row.updated_at, row.deleted_at, 'secrets');
      await db.runAsync(
        'UPDATE secrets SET synced_at = ?2 WHERE id = ?1 AND updated_at = ?2',
        row.id,
        row.updated_at,
      );
      summary.uploaded++;
    } catch (error) {
      summary.failed++;
      summary.errors.push(`Subir clave "${row.title}": ${reason(error)}`);
    }
  }
}

async function applyRemote(
  db: SQLiteDatabase,
  keys: Subkeys,
  row: Awaited<ReturnType<typeof fetchChangesSince>>[number],
) {
  const remoteAt = new Date(row.updated_at).toISOString();
  const local = await db.getFirstAsync<{ updated_at: string }>(
    'SELECT updated_at FROM secrets WHERE id = ?',
    row.id,
  );
  if (local && new Date(local.updated_at).getTime() >= new Date(remoteAt).getTime()) return false;

  if (row.deleted_at) {
    await db.runAsync(
      `INSERT INTO secrets (id, kind, title, data, search_text, created_at, updated_at, deleted_at, synced_at)
       VALUES (?1, 'note', '', '{}', '', ?2, ?2, ?2, ?2)
       ON CONFLICT(id) DO UPDATE SET data = '{}', search_text = '', deleted_at = ?2,
         updated_at = ?2, synced_at = ?2`,
      row.id,
      remoteAt,
    );
    return true;
  }
  const value = decryptPayload(crypto, keys.metaKey, row.id, row.payload_enc, 'secret') as {
    title?: unknown;
    data?: unknown;
    createdAt?: unknown;
  };
  if (typeof value.title !== 'string' || typeof value.createdAt !== 'string') {
    throw new Error('Clave con formato desconocido');
  }
  const data = parseSecretData(value.data);
  await db.runAsync(
    `INSERT INTO secrets (id, kind, title, data, search_text, created_at, updated_at, synced_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)
     ON CONFLICT(id) DO UPDATE SET kind = ?2, title = ?3, data = ?4, search_text = ?5,
       updated_at = ?7, deleted_at = NULL, synced_at = ?7`,
    row.id,
    data.kind,
    value.title,
    JSON.stringify(data),
    searchTextFor({ title: value.title, data }),
    value.createdAt,
    remoteAt,
  );
  return true;
}

export async function pullSecrets(db: SQLiteDatabase, keys: Subkeys, summary: Summary) {
  const raw = await getSetting(db, cursorKey);
  let cursor: SyncCursor | null = raw ? (JSON.parse(raw) as SyncCursor) : null;
  for (;;) {
    const rows = await fetchChangesSince(cursor, 100, 'secrets');
    if (rows.length === 0) return;
    for (const row of rows) {
      try {
        if (await applyRemote(db, keys, row)) summary.downloaded++;
      } catch (error) {
        summary.failed++;
        summary.errors.push(`Bajar una clave: ${reason(error)}`);
        return; // el cursor no avanza: se reintenta en la próxima sincronización
      }
      cursor = { at: row.server_updated_at, id: row.id };
      await setSetting(db, cursorKey, JSON.stringify(cursor));
    }
  }
}
