import type { SQLiteDatabase } from 'expo-sqlite';

import { refreshCover } from '@/db/pages-repo';

import { storeEncrypted } from './encrypted-store';
import { deleteLocalFile, localFile } from './local-store';
import { isEncryptedPath, pageFilePath, pageThumbPath } from './storage-paths';

type LegacyPage = {
  id: string;
  document_id: string;
  file_path: string;
  thumb_path: string | null;
  mime_type: string;
};

// Cifra los archivos que la fase 2 guardó en claro (.webp/.pdf) y actualiza sus rutas.
export async function encryptLegacyFiles(db: SQLiteDatabase, fileKey: Uint8Array): Promise<number> {
  const pages = await db.getAllAsync<LegacyPage>(
    `SELECT id, document_id, file_path, thumb_path, mime_type FROM document_pages
     WHERE file_path NOT LIKE '%.bin'`,
  );
  const touchedDocuments = new Set<string>();

  for (const page of pages) {
    if (isEncryptedPath(page.file_path)) continue;
    const filePath = pageFilePath(page.document_id, page.id);
    const kind = page.mime_type === 'application/pdf' ? 'pdf' : 'page';
    let thumbPath: string | null = null;

    if (localFile(page.file_path).exists) {
      await storeEncrypted(fileKey, localFile(page.file_path).uri, filePath, page.id, kind);
    }
    if (page.thumb_path && localFile(page.thumb_path).exists) {
      thumbPath = pageThumbPath(page.document_id, page.id);
      await storeEncrypted(fileKey, localFile(page.thumb_path).uri, thumbPath, page.id, 'thumb');
    }
    await db.runAsync(
      'UPDATE document_pages SET file_path = ?, thumb_path = ? WHERE id = ?',
      filePath,
      thumbPath,
      page.id,
    );
    // Solo se borra el original en claro después de guardar la versión cifrada.
    deleteLocalFile(page.file_path);
    deleteLocalFile(page.thumb_path);
    touchedDocuments.add(page.document_id);
  }

  for (const documentId of touchedDocuments) await refreshCover(db, documentId);
  return pages.length;
}
