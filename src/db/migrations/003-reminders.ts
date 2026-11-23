// Fase 4: avisos de vencimiento. Casilla de alertas por documento y tabla de ajustes
// (vive en la base cifrada: solo se lee con la bóveda abierta).
export const migration003 = `
ALTER TABLE documents ADD COLUMN alerts_enabled INTEGER NOT NULL DEFAULT 1;

CREATE TABLE settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;
