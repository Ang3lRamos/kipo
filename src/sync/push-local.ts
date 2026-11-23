import type { SQLiteDatabase } from 'expo-sqlite';

import { nativePrimitives } from '@/crypto/native-primitives';
import { encryptPayload } from '@/crypto/payload-crypto';
import type { Subkeys } from '@/crypto/subkeys';
import { listPages } from '@/db/pages-repo';
import { localFile } from '@/files/local-store';
import type { DocumentRecord } from '@/types/document';

import { upsertRemoteDocument, uploadObject } from './cloud-api';
import { markDocumentSynced, markPageSynced, pagesToUpload } from './local-sync-repo';
import { buildPayload } from './payload';

// Sube un documento pendiente. Orden: archivos → metadatos, para que en la nube nunca haya
// un documento que apunte a páginas que todavía no existen en R2.
export async function pushDocument(
  db: SQLiteDatabase,
  keys: Subkeys,
  doc: DocumentRecord,
): Promise<'pushed' | 'remote-newer'> {
  const pages = await listPages(db, doc.id);

  if (!doc.deletedAt) {
    const pending = new Set(await pagesToUpload(db, doc.id));
    for (const page of pages) {
      if (!pending.has(page.id)) continue;
      // Se suben los .bin tal cual: ya están cifrados con la llave de archivos.
      const target = { documentId: doc.id, pageId: page.id };
      await uploadObject({ ...target, kind: 'page' }, localFile(page.filePath));
      if (page.thumbPath) {
        await uploadObject({ ...target, kind: 'thumb' }, localFile(page.thumbPath));
      }
      await markPageSynced(db, page.id);
    }
  }

  const payload = encryptPayload(nativePrimitives, keys.metaKey, doc.id, buildPayload(doc, pages));
  const applied = await upsertRemoteDocument(doc.id, payload, doc.updatedAt, doc.deletedAt);
  // Si no se aplicó, la nube tiene una versión igual o más nueva: la descarga la trae.
  await markDocumentSynced(db, doc.id, doc.updatedAt);
  return applied ? 'pushed' : 'remote-newer';
}
