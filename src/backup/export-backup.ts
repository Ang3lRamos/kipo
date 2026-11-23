import type { File } from 'expo-file-system';
import { FileMode } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import { nativePrimitives as crypto } from '@/crypto/native-primitives';
import { encryptPayload } from '@/crypto/payload-crypto';
import { serializeVaultRecord } from '@/crypto/vault';
import { rowToDocument, type DocumentRow } from '@/db/document-mapper';
import { listPages } from '@/db/pages-repo';
import type { Session } from '@/features/lock/vault-actions';
import { localFile } from '@/files/local-store';
import { buildPayload } from '@/sync/payload';

import {
  encodePreamble,
  sealManifest,
  type BackupFile,
  type BackupManifest,
  type BackupRow,
} from './backup-format';

export type BackupCounts = { documents: number; secrets: number; files: number };
type SecretRow = {
  id: string;
  title: string;
  data: string;
  created_at: string;
  updated_at: string;
};

async function collectDocuments(db: SQLiteDatabase, metaKey: Uint8Array) {
  const rows = await db.getAllAsync<DocumentRow>(
    'SELECT * FROM documents WHERE deleted_at IS NULL ORDER BY created_at',
  );
  const documents: BackupRow[] = [];
  const files: (Omit<BackupFile, 'offset'> & { path: string })[] = [];
  for (const row of rows) {
    const doc = rowToDocument(row);
    const pages = await listPages(db, doc.id);
    const payload = encryptPayload(crypto, metaKey, doc.id, buildPayload(doc, pages));
    documents.push({ id: doc.id, updatedAt: doc.updatedAt, payload });
    for (const page of pages) {
      const parts = [
        { kind: 'page' as const, path: page.filePath },
        ...(page.thumbPath ? [{ kind: 'thumb' as const, path: page.thumbPath }] : []),
      ];
      for (const part of parts) {
        const file = localFile(part.path);
        if (!file.exists) continue; // una página que nunca bajó de la nube: queda en la nube
        files.push({ documentId: doc.id, pageId: page.id, ...part, length: file.size });
      }
    }
  }
  return { documents, files };
}

async function collectSecrets(db: SQLiteDatabase, metaKey: Uint8Array): Promise<BackupRow[]> {
  const rows = await db.getAllAsync<SecretRow>(
    'SELECT id, title, data, created_at, updated_at FROM secrets WHERE deleted_at IS NULL',
  );
  // Igual que lo que sube a la nube (secrets-sync.ts), para importarlo con el mismo código.
  return rows.map((row) => ({
    id: row.id,
    updatedAt: row.updated_at,
    payload: encryptPayload(
      crypto,
      metaKey,
      row.id,
      { v: 1, title: row.title, data: JSON.parse(row.data) as unknown, createdAt: row.created_at },
      'secret',
    ),
  }));
}

// Escribe el respaldo completo en `destination` (un archivo que el usuario eligió). Los
// archivos se copian uno a uno, así nunca está todo el respaldo en memoria.
export async function exportBackup(
  db: SQLiteDatabase,
  session: Session,
  destination: File,
): Promise<BackupCounts> {
  const { metaKey } = session.keys;
  const { documents, files } = await collectDocuments(db, metaKey);
  const secrets = await collectSecrets(db, metaKey);

  let offset = 0;
  const placed = files.map((f) => {
    const entry = { ...f, offset };
    offset += f.length;
    return entry;
  });
  const manifest: BackupManifest = {
    v: 1,
    documents,
    secrets,
    files: placed.map(({ path: _path, ...entry }) => entry),
  };
  const preamble = encodePreamble({
    v: 1,
    createdAt: new Date().toISOString(),
    vault: serializeVaultRecord(session.record),
    manifest: sealManifest(crypto, metaKey, manifest),
  });

  const handle = destination.open(FileMode.WriteOnly);
  try {
    await handle.writeBytes(preamble);
    for (const file of placed) {
      const bytes = await localFile(file.path).bytes();
      if (bytes.length !== file.length) throw new Error('Un archivo cambió durante el respaldo');
      await handle.writeBytes(bytes);
    }
  } finally {
    handle.close();
  }
  return { documents: documents.length, secrets: secrets.length, files: placed.length };
}
