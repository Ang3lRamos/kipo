import { randomUUID } from 'expo-crypto';
import type { SQLiteBindValue, SQLiteDatabase } from 'expo-sqlite';

import type { Category, DocumentInput, DocumentRecord } from '@/types/document';

import { logActivity } from './activity-repo';
import { rowToDocument, type DocumentRow } from './document-mapper';
import { buildFtsQuery } from './fts-query';

export type DocumentFilter = { query?: string; category?: Category | null };

function inputParams(input: DocumentInput): SQLiteBindValue[] {
  return [
    input.title.trim(),
    input.category,
    JSON.stringify(input.tags),
    input.physicalLocation,
    input.issuedAt,
    input.expiresAt,
    input.notes,
  ];
}

export async function createDocument(db: SQLiteDatabase, input: DocumentInput): Promise<string> {
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO documents
         (title, category, tags, physical_location, issued_at, expires_at, notes,
          id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
         issued_at = ?, expires_at = ?, notes = ?, updated_at = ?
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
): Promise<DocumentRecord[]> {
  const ftsQuery = buildFtsQuery(filter.query ?? '');
  const category = filter.category ?? null;

  // Pesos de bm25 por columna: título > etiquetas = ubicación > notas = OCR.
  const rows = ftsQuery
    ? await db.getAllAsync<DocumentRow>(
        `SELECT d.* FROM documents_fts f
         JOIN documents d ON d.rowid = f.rowid
         WHERE documents_fts MATCH ? AND d.deleted_at IS NULL AND (? IS NULL OR d.category = ?)
         ORDER BY bm25(documents_fts, 10.0, 5.0, 1.0, 5.0, 1.0)
         LIMIT 200`,
        ftsQuery,
        category,
        category,
      )
    : await db.getAllAsync<DocumentRow>(
        `SELECT * FROM documents
         WHERE deleted_at IS NULL AND (? IS NULL OR category = ?)
         ORDER BY updated_at DESC
         LIMIT 200`,
        category,
        category,
      );
  return rows.map(rowToDocument);
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
