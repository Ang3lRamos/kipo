import type { BackupCounts } from '@/backup/export-backup';
import type { ImportCounts } from '@/backup/import-backup';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function describeExport(c: BackupCounts): string {
  return `Respaldo guardado: ${plural(c.documents, 'documento', 'documentos')} y ${plural(c.secrets, 'clave', 'claves')}`;
}

export function describeImport(c: ImportCounts): string {
  if (c.documents === 0 && c.secrets === 0) return 'Ya tenías todo lo del respaldo';
  return `Importados: ${plural(c.documents, 'documento', 'documentos')} y ${plural(c.secrets, 'clave', 'claves')}`;
}
