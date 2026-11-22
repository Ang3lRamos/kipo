import { categories, type Category, type DocumentRecord } from '@/types/document';

// Fila tal como sale de SQLite (snake_case, tags en JSON).
export type DocumentRow = {
  id: string;
  title: string;
  category: string;
  tags: string;
  physical_location: string | null;
  issued_at: string | null;
  expires_at: string | null;
  notes: string | null;
  ocr_text: string | null;
  file_path: string | null;
  thumb_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  synced_at: string | null;
};

export function isCategory(value: string): value is Category {
  return (categories as readonly string[]).includes(value);
}

export function parseTags(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

export function rowToDocument(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    title: row.title,
    category: isCategory(row.category) ? row.category : 'otro',
    tags: parseTags(row.tags),
    physicalLocation: row.physical_location,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    notes: row.notes,
    ocrText: row.ocr_text,
    filePath: row.file_path,
    thumbPath: row.thumb_path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncedAt: row.synced_at,
  };
}
