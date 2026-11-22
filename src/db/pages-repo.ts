import type { SQLiteDatabase } from 'expo-sqlite';

import type { DocumentPage, NewPage, PageMimeType } from '@/types/page';

type PageRow = {
  id: string;
  document_id: string;
  position: number;
  file_path: string;
  thumb_path: string | null;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  created_at: string;
};

function toMime(value: string): PageMimeType {
  return value === 'application/pdf' ? 'application/pdf' : 'image/webp';
}

function rowToPage(row: PageRow): DocumentPage {
  return {
    id: row.id,
    documentId: row.document_id,
    position: row.position,
    filePath: row.file_path,
    thumbPath: row.thumb_path,
    mimeType: toMime(row.mime_type),
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    createdAt: row.created_at,
  };
}

export async function listPages(db: SQLiteDatabase, documentId: string): Promise<DocumentPage[]> {
  const rows = await db.getAllAsync<PageRow>(
    `SELECT * FROM document_pages WHERE document_id = ? AND deleted_at IS NULL
     ORDER BY position ASC`,
    documentId,
  );
  return rows.map(rowToPage);
}

export async function getPage(db: SQLiteDatabase, id: string): Promise<DocumentPage | null> {
  const row = await db.getFirstAsync<PageRow>(
    'SELECT * FROM document_pages WHERE id = ? AND deleted_at IS NULL',
    id,
  );
  return row ? rowToPage(row) : null;
}

// Actualiza la portada y el tamaño total del documento a partir de sus páginas.
async function refreshCover(db: SQLiteDatabase, documentId: string): Promise<void> {
  await db.runAsync(
    `UPDATE documents SET
       thumb_path = (SELECT thumb_path FROM document_pages
                     WHERE document_id = ?1 AND deleted_at IS NULL AND thumb_path IS NOT NULL
                     ORDER BY position LIMIT 1),
       mime_type = (SELECT mime_type FROM document_pages
                    WHERE document_id = ?1 AND deleted_at IS NULL ORDER BY position LIMIT 1),
       size_bytes = (SELECT SUM(size_bytes) FROM document_pages
                     WHERE document_id = ?1 AND deleted_at IS NULL),
       updated_at = ?2
     WHERE id = ?1`,
    documentId,
    new Date().toISOString(),
  );
}

export async function addPages(
  db: SQLiteDatabase,
  documentId: string,
  pages: NewPage[],
): Promise<void> {
  if (pages.length === 0) return;
  await db.withTransactionAsync(async () => {
    const last = await db.getFirstAsync<{ max: number | null }>(
      'SELECT MAX(position) AS max FROM document_pages WHERE document_id = ? AND deleted_at IS NULL',
      documentId,
    );
    let position = (last?.max ?? -1) + 1;
    const now = new Date().toISOString();
    for (const page of pages) {
      await db.runAsync(
        `INSERT INTO document_pages (id, document_id, position, file_path, thumb_path, mime_type,
           size_bytes, width, height, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        page.id,
        documentId,
        position++,
        page.filePath,
        page.thumbPath,
        page.mimeType,
        page.sizeBytes,
        page.width,
        page.height,
        now,
      );
    }
    await refreshCover(db, documentId);
  });
}

export async function softDeletePage(db: SQLiteDatabase, page: DocumentPage): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE document_pages SET deleted_at = ? WHERE id = ?',
      new Date().toISOString(),
      page.id,
    );
    await refreshCover(db, page.documentId);
  });
}
