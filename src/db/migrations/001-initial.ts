// Esquema inicial (fase 1). Nunca editar una migración ya aplicada: crear una nueva.
export const migration001 = `
CREATE TABLE documents (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  physical_location TEXT,
  issued_at TEXT,
  expires_at TEXT,
  notes TEXT,
  ocr_text TEXT,
  file_path TEXT,
  thumb_path TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  synced_at TEXT
);

CREATE INDEX idx_documents_category ON documents(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_expires ON documents(expires_at) WHERE deleted_at IS NULL;

-- Índice de texto completo enlazado a documents (contenido externo).
-- remove_diacritics permite encontrar "cédula" escribiendo "cedula".
CREATE VIRTUAL TABLE documents_fts USING fts5(
  title, tags, notes, physical_location, ocr_text,
  content='documents', content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER documents_ai AFTER INSERT ON documents BEGIN
  INSERT INTO documents_fts(rowid, title, tags, notes, physical_location, ocr_text)
  VALUES (new.rowid, new.title, new.tags, new.notes, new.physical_location, new.ocr_text);
END;

CREATE TRIGGER documents_ad AFTER DELETE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, rowid, title, tags, notes, physical_location, ocr_text)
  VALUES ('delete', old.rowid, old.title, old.tags, old.notes, old.physical_location, old.ocr_text);
END;

CREATE TRIGGER documents_au AFTER UPDATE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, rowid, title, tags, notes, physical_location, ocr_text)
  VALUES ('delete', old.rowid, old.title, old.tags, old.notes, old.physical_location, old.ocr_text);
  INSERT INTO documents_fts(rowid, title, tags, notes, physical_location, ocr_text)
  VALUES (new.rowid, new.title, new.tags, new.notes, new.physical_location, new.ocr_text);
END;

CREATE TABLE activity_log (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL REFERENCES documents(id),
  action TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_activity_document ON activity_log(document_id, created_at);
`;
