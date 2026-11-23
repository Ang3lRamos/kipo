import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { fold } from '@/ocr/text';
import { parseSecretData } from '@/secrets/secret-codec';
import { searchTextFor } from '@/secrets/secret-rules';
import type { SecretInput, SecretKind, SecretRecord } from '@/types/secret';

export type SecretRow = {
  id: string;
  kind: string;
  title: string;
  data: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  synced_at: string | null;
};

export function rowToSecret(row: SecretRow): SecretRecord {
  return {
    id: row.id,
    title: row.title,
    data: parseSecretData(JSON.parse(row.data)),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncedAt: row.synced_at,
  };
}

export async function listSecrets(
  db: SQLiteDatabase,
  filter: { query?: string; kind?: SecretKind | null } = {},
): Promise<SecretRecord[]> {
  const words = fold(filter.query ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);
  // Cada palabra debe aparecer en el texto de búsqueda (que no tiene contraseñas).
  const conditions = words.map(() => `search_text LIKE ? ESCAPE '\\'`).join(' AND ');
  const params = words.map((w) => `%${w.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
  const rows = await db.getAllAsync<SecretRow>(
    `SELECT * FROM secrets
     WHERE deleted_at IS NULL AND (? IS NULL OR kind = ?) ${conditions ? `AND ${conditions}` : ''}
     ORDER BY title COLLATE NOCASE
     LIMIT 300`,
    filter.kind ?? null,
    filter.kind ?? null,
    ...params,
  );
  return rows.map(rowToSecret);
}

export async function getSecret(db: SQLiteDatabase, id: string): Promise<SecretRecord | null> {
  const row = await db.getFirstAsync<SecretRow>(
    'SELECT * FROM secrets WHERE id = ? AND deleted_at IS NULL',
    id,
  );
  return row ? rowToSecret(row) : null;
}

export async function createSecret(db: SQLiteDatabase, input: SecretInput): Promise<string> {
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO secrets (id, kind, title, data, search_text, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.data.kind,
    input.title.trim(),
    JSON.stringify(input.data),
    searchTextFor(input),
    now,
    now,
  );
  return id;
}

export async function updateSecret(
  db: SQLiteDatabase,
  id: string,
  input: SecretInput,
): Promise<void> {
  await db.runAsync(
    `UPDATE secrets SET kind = ?, title = ?, data = ?, search_text = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    input.data.kind,
    input.title.trim(),
    JSON.stringify(input.data),
    searchTextFor(input),
    new Date().toISOString(),
    id,
  );
}

// Borrado lógico: la fila queda para propagar el borrado a la nube. Los datos se vacían.
export async function softDeleteSecret(db: SQLiteDatabase, id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE secrets SET deleted_at = ?, updated_at = ?, data = '{}', search_text = '' WHERE id = ?`,
    now,
    now,
    id,
  );
}
