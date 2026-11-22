// Fase 2: varias páginas por documento. documents.thumb_path y size_bytes pasan a ser
// la miniatura de portada (primera página) y el tamaño total.
export const migration002 = `
CREATE TABLE document_pages (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL REFERENCES documents(id),
  position INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  thumb_path TEXT,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TEXT NOT NULL,
  deleted_at TEXT,
  synced_at TEXT
);

CREATE INDEX idx_pages_document ON document_pages(document_id, position) WHERE deleted_at IS NULL;
`;
