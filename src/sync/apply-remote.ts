import type { SQLiteDatabase } from 'expo-sqlite';

import { nativePrimitives } from '@/crypto/native-primitives';
import { decryptPayload } from '@/crypto/payload-crypto';
import type { Subkeys } from '@/crypto/subkeys';
import { refreshCover } from '@/db/pages-repo';
import { deleteDocumentFiles, deleteLocalFile, localFile } from '@/files/local-store';
import { pageFilePath, pageThumbPath } from '@/files/storage-paths';

import { downloadObject, type RemoteDocument } from './cloud-api';
import { localPageIds, localUpdatedAt } from './local-sync-repo';
import { parsePayload, type DocumentPayload } from './payload';

// Aplica en el teléfono un documento bajado de la nube, si es más nuevo que el local.

const toIso = (timestamp: string) => new Date(timestamp).toISOString();

// Consigue los archivos de las páginas que faltan en el teléfono. Por defecto, de R2; el
// respaldo .kipo los saca del propio archivo.
export type ObtainPages = (
  documentId: string,
  payload: DocumentPayload,
  have: Set<string>,
) => Promise<void>;

const downloadMissingPages: ObtainPages = async (documentId, payload, have) => {
  for (const page of payload.pages) {
    if (have.has(page.id)) continue;
    // Los archivos llegan cifrados tal como se subieron: se guardan sin descifrar.
    const target = { documentId, pageId: page.id };
    await downloadObject({ ...target, kind: 'page' }, localFile(pageFilePath(documentId, page.id)));
    if (page.hasThumb) {
      await downloadObject(
        { ...target, kind: 'thumb' },
        localFile(pageThumbPath(documentId, page.id)),
      );
    }
  }
};

async function writeDocument(db: SQLiteDatabase, id: string, p: DocumentPayload, at: string) {
  await db.runAsync(
    `INSERT INTO documents (id, title, category, tags, physical_location, issued_at, expires_at,
       notes, ocr_text, alerts_enabled, created_at, updated_at, deleted_at, synced_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, NULL, ?12)
     ON CONFLICT(id) DO UPDATE SET title = ?2, category = ?3, tags = ?4, physical_location = ?5,
       issued_at = ?6, expires_at = ?7, notes = ?8, ocr_text = ?9, alerts_enabled = ?10,
       updated_at = ?12, deleted_at = NULL, synced_at = ?12`,
    id,
    p.title,
    p.category,
    JSON.stringify(p.tags),
    p.physicalLocation,
    p.issuedAt,
    p.expiresAt,
    p.notes,
    p.ocrText,
    p.alertsEnabled ? 1 : 0,
    p.createdAt,
    at,
  );
}

async function writePages(
  db: SQLiteDatabase,
  documentId: string,
  p: DocumentPayload,
  have: Set<string>,
) {
  const keep = new Set(p.pages.map((page) => page.id));
  const now = new Date().toISOString();
  for (const page of p.pages) {
    await db.runAsync(
      `INSERT INTO document_pages (id, document_id, position, file_path, thumb_path, mime_type,
         size_bytes, width, height, created_at, synced_at, ocr_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET position = excluded.position,
         ocr_text = COALESCE(excluded.ocr_text, document_pages.ocr_text)`,
      page.id,
      documentId,
      page.position,
      pageFilePath(documentId, page.id),
      page.hasThumb ? pageThumbPath(documentId, page.id) : null,
      page.mimeType,
      page.sizeBytes,
      page.width,
      page.height,
      page.createdAt,
      now,
      page.ocrText ?? null,
    );
  }
  // Páginas borradas en el otro teléfono.
  for (const pageId of have) {
    if (keep.has(pageId)) continue;
    await db.runAsync('UPDATE document_pages SET deleted_at = ? WHERE id = ?', now, pageId);
    deleteLocalFile(pageFilePath(documentId, pageId));
    deleteLocalFile(pageThumbPath(documentId, pageId));
  }
}

export async function applyRemoteDocument(
  db: SQLiteDatabase,
  keys: Subkeys,
  row: RemoteDocument,
  obtainPages: ObtainPages = downloadMissingPages,
): Promise<'applied' | 'skipped'> {
  const remoteAt = toIso(row.updated_at);
  const localAt = await localUpdatedAt(db, row.id);
  // Gana el más reciente: si lo local es igual o más nuevo, se sube en el siguiente paso.
  if (localAt && new Date(localAt).getTime() >= new Date(remoteAt).getTime()) return 'skipped';

  if (row.deleted_at) {
    await db.runAsync(
      'UPDATE documents SET deleted_at = ?2, updated_at = ?2, synced_at = ?2 WHERE id = ?1',
      row.id,
      remoteAt,
    );
    deleteDocumentFiles(row.id);
    return 'applied';
  }

  const payload = parsePayload(
    decryptPayload(nativePrimitives, keys.metaKey, row.id, row.payload_enc),
  );
  const have = await localPageIds(db, row.id);
  // Primero los archivos (fuera de la transacción): si falla la red, no queda nada a medias.
  await obtainPages(row.id, payload, have);
  await db.withTransactionAsync(async () => {
    await writeDocument(db, row.id, payload, remoteAt);
    await writePages(db, row.id, payload, have);
    await refreshCover(db, row.id, { touch: false });
  });
  return 'applied';
}
