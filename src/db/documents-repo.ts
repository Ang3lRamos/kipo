import { randomUUID } from 'expo-crypto';
import type { SQLiteBindValue, SQLiteDatabase } from 'expo-sqlite';

import type { Category, DocumentInput, DocumentRecord } from '@/types/document';

import { logActivity } from './activity-repo';
import { rowToDocument, type DocumentRow } from './document-mapper';
import { buildFtsQuery } from './fts-query';

export type DocumentFilter = { query?: string; category?: Category | null };

// Resultado de búsqueda: el documento y sus textos con las coincidencias marcadas.
export type ListedDocument = DocumentRecord & {
  highlight?: { title: string | null; location: string | null; ocr: string | null };
};

type HighlightColumns = {
  hl_title: string | null;
  hl_location: string | null;
  hl_ocr: string | null;
};

function inputParams(input: DocumentInput): SQLiteBindValue[] {
  return [
    input.title.trim(),
    input.category,
    JSON.stringify(input.tags),
    input.physicalLocation,
    input.issuedAt,
    input.expiresAt,
    input.notes,
    input.alertsEnabled ? 1 : 0,
  ];
}

export async function createDocument(db: SQLiteDatabase, input: DocumentInput): Promise<string> {
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO documents
         (title, category, tags, physical_location, issued_at, expires_at, notes, alerts_enabled,
          id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ...inputParams(input),
      id,
      now,
      now,
    );
    await logActivity(db, id, 'creado');
  });
  return id;
}

export async function updateDocument(
  db: SQLiteDatabase,
  id: string,
  input: DocumentInput,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE documents SET title = ?, category = ?, tags = ?, physical_location = ?,
         issued_at = ?, expires_at = ?, notes = ?, alerts_enabled = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`,
      ...inputParams(input),
      new Date().toISOString(),
      id,
    );
    await logActivity(db, id, 'editado');
  });
}

// Borrado lógico: la fila se conserva para que la sincronización propague el borrado.
export async function softDeleteDocument(db: SQLiteDatabase, id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE documents SET deleted_at = ?, updated_at = ? WHERE id = ?',
    now,
    now,
    id,
  );
}

export async function getDocument(db: SQLiteDatabase, id: string): Promise<DocumentRecord | null> {
  const row = await db.getFirstAsync<DocumentRow>(
    'SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL',
    id,
  );
  return row ? rowToDocument(row) : null;
}

export async function listDocuments(
  db: SQLiteDatabase,
  filter: DocumentFilter = {},
): Promise<ListedDocument[]> {
  const ftsQuery = buildFtsQuery(filter.query ?? '');
  const category = filter.category ?? null;

  if (!ftsQuery) {
    const rows = await db.getAllAsync<DocumentRow>(
      `SELECT * FROM documents
       WHERE deleted_at IS NULL AND (? IS NULL OR category = ?)
       ORDER BY updated_at DESC
       LIMIT 200`,
      category,
      category,
    );
    return rows.map(rowToDocument);
  }

  // Columnas del índice: 0 título, 1 etiquetas, 2 notas, 3 ubicación, 4 OCR.
  // Pesos de bm25: título > etiquetas = ubicación > notas = OCR.
  // highlight/snippet marcan las coincidencias con char(2)…char(3) (ver highlight.ts).
  const rows = await db.getAllAsync<DocumentRow & HighlightColumns>(
    `SELECT d.*,
       highlight(documents_fts, 0, char(2), char(3)) AS hl_title,
       highlight(documents_fts, 3, char(2), char(3)) AS hl_location,
       snippet(documents_fts, 4, char(2), char(3), '…', 10) AS hl_ocr
     FROM documents_fts f
     JOIN documents d ON d.rowid = f.rowid
     WHERE documents_fts MATCH ? AND d.deleted_at IS NULL AND (? IS NULL OR d.category = ?)
     ORDER BY bm25(documents_fts, 10.0, 5.0, 1.0, 5.0, 1.0)
     LIMIT 200`,
    ftsQuery,
    category,
    category,
  );
  return rows.map((row) => ({
    ...rowToDocument(row),
    highlight: { title: row.hl_title, location: row.hl_location, ocr: row.hl_ocr },
  }));
}

// Documentos que vencen hasta `untilDate` (AAAA-MM-DD), incluidos los ya vencidos.
export async function listExpiring(
  db: SQLiteDatabase,
  untilDate: string,
): Promise<DocumentRecord[]> {
  const rows = await db.getAllAsync<DocumentRow>(
    `SELECT * FROM documents
     WHERE deleted_at IS NULL AND expires_at IS NOT NULL AND expires_at <= ?
     ORDER BY expires_at ASC`,
    untilDate,
  );
  return rows.map(rowToDocument);
}

// Borrado lógico de varios a la vez: una sola sentencia, atómica sin abrir una transacción.
export async function softDeleteDocuments(db: SQLiteDatabase, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE documents SET deleted_at = ?, updated_at = ? WHERE id IN (${ids.map(() => '?').join(',')})`,
    now,
    now,
    ...ids,
  );
}
