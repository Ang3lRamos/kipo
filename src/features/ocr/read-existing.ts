import type { SQLiteDatabase } from 'expo-sqlite';

import type { Subkeys } from '@/crypto/subkeys';
import { refreshCover } from '@/db/pages-repo';
import { storePdfThumb } from '@/features/pages/import-pages';
import { decryptToTemp } from '@/files/encrypted-store';
import { pageThumbPath } from '@/files/storage-paths';
import { readCapture } from '@/ocr/read-capture';
import { recognizeImage } from '@/ocr/recognize';

// Lee el texto de páginas guardadas antes de la fase 6 (ocr_text IS NULL). Cada página se
// descifra a la caché temporal, se lee y el temporal se borra de inmediato. A los PDF viejos
// también les hace la miniatura. Los documentos tocados quedan pendientes de subir.

type PendingPage = {
  id: string;
  document_id: string;
  file_path: string;
  thumb_path: string | null;
  mime_type: string;
};

export async function countUnreadPages(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT count(*) AS n FROM document_pages WHERE deleted_at IS NULL AND ocr_text IS NULL',
  );
  return row?.n ?? 0;
}

async function readPage(keys: Subkeys, page: PendingPage) {
  const isPdf = page.mime_type === 'application/pdf';
  const temp = await decryptToTemp(keys.fileKey, page.file_path, page.id, isPdf ? 'pdf' : 'page');
  try {
    if (!isPdf) return { text: await recognizeImage(temp.uri), thumbPath: null };
    const needsThumb = page.thumb_path === null;
    const reading = await readCapture(
      { uri: temp.uri, kind: 'pdf' },
      { keepFirstPage: needsThumb },
    );
    const thumbPath = pageThumbPath(page.document_id, page.id);
    const made =
      needsThumb && (await storePdfThumb(keys.fileKey, reading.firstPageImage, thumbPath, page.id));
    return { text: reading.text, thumbPath: made ? thumbPath : null };
  } finally {
    if (temp.exists) temp.delete(); // nada descifrado queda en disco
  }
}

export async function readExistingPages(
  db: SQLiteDatabase,
  keys: Subkeys,
  onProgress: (done: number, total: number) => void,
): Promise<{ read: number; failed: number }> {
  const pages = await db.getAllAsync<PendingPage>(
    `SELECT id, document_id, file_path, thumb_path, mime_type FROM document_pages
     WHERE deleted_at IS NULL AND ocr_text IS NULL ORDER BY document_id, position`,
  );
  const touched = new Set<string>();
  let failed = 0;
  for (const [index, page] of pages.entries()) {
    onProgress(index, pages.length);
    try {
      const { text, thumbPath } = await readPage(keys, page);
      // '' = analizada sin texto: no se vuelve a intentar.
      await db.runAsync(
        'UPDATE document_pages SET ocr_text = ?, thumb_path = COALESCE(?, thumb_path) WHERE id = ?',
        text,
        thumbPath,
        page.id,
      );
      touched.add(page.document_id);
    } catch (error) {
      failed++;
      console.warn('No se pudo leer una página guardada', error);
    }
  }
  // refreshCover arma ocr_text del documento (lo indexa la búsqueda) y lo marca para subir.
  for (const documentId of touched) await refreshCover(db, documentId);
  onProgress(pages.length, pages.length);
  return { read: pages.length - failed, failed };
}
