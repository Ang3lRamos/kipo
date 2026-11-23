// Fase 7: claves y notas seguras. `data` guarda los campos en JSON dentro de la base cifrada
// (SQLCipher); `search_text` es lo único que se busca y nunca incluye contraseñas ni notas.
export const migration005 = `
CREATE TABLE secrets (
  id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  data TEXT NOT NULL,
  search_text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  synced_at TEXT
);

CREATE INDEX idx_secrets_updated ON secrets(updated_at) WHERE deleted_at IS NULL;
`;
