import type { File, FileHandle } from 'expo-file-system';
import { FileMode } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import { nativePrimitives as crypto } from '@/crypto/native-primitives';
import type { Subkeys } from '@/crypto/subkeys';
import { parseVaultRecord, type VaultRecord } from '@/crypto/vault';
import { localFile } from '@/files/local-store';
import { pageFilePath, pageThumbPath } from '@/files/storage-paths';
import { afterLocalChange } from '@/sync/after-local-change';
import { applyRemoteDocument, type ObtainPages } from '@/sync/apply-remote';
import { applyRemoteSecret } from '@/sync/secrets-sync';

import {
  InvalidBackupError,
  openManifest,
  parseHeader,
  preambleSize,
  readHeaderLength,
  type BackupFile,
  type BackupHeader,
} from './backup-format';

export type OpenedBackup = { header: BackupHeader; record: VaultRecord; dataStart: number };
export type ImportCounts = { documents: number; secrets: number; skipped: number };

// Lee solo el encabezado: alcanza para pedir la contraseña antes de tocar nada.
export async function readBackup(file: File): Promise<OpenedBackup> {
  const handle = file.open(FileMode.ReadOnly);
  try {
    const length = readHeaderLength(await handle.readBytes(12));
    const json = await handle.readBytes(length);
    if (json.length !== length) throw new InvalidBackupError('El respaldo está incompleto');
    const header = parseHeader(json);
    let record: VaultRecord;
    try {
      record = parseVaultRecord(header.vault);
    } catch {
      throw new InvalidBackupError();
    }
    return { header, record, dataStart: preambleSize(length) };
  } finally {
    handle.close();
  }
}

// ¿El respaldo es de esta misma bóveda? La envoltura con la clave de recuperación no cambia
// al cambiar la contraseña, así que identifica a la bóveda (y a su DEK).
export function sameVault(a: VaultRecord, b: VaultRecord): boolean {
  const x = a.wrappedByRecovery;
  const y = b.wrappedByRecovery;
  return x.length === y.length && x.every((byte, i) => byte === y[i]);
}

async function readAt(handle: FileHandle, position: number, length: number): Promise<Uint8Array> {
  handle.offset = position;
  const bytes = await handle.readBytes(length);
  // Formato de src/crypto/aead.ts: empieza con la versión 1. Nada que no sea de Kipo entra.
  if (bytes.length !== length || bytes[0] !== 1) {
    throw new InvalidBackupError('Un archivo del respaldo está dañado');
  }
  return bytes;
}

function pagesFromBackup(handle: FileHandle, dataStart: number, files: BackupFile[]): ObtainPages {
  return async (documentId, payload, have) => {
    for (const page of payload.pages) {
      if (have.has(page.id)) continue;
      for (const entry of files) {
        if (entry.documentId !== documentId || entry.pageId !== page.id) continue;
        const path =
          entry.kind === 'page'
            ? pageFilePath(documentId, page.id)
            : pageThumbPath(documentId, page.id);
        // Se guardan tal cual: siguen cifrados con la llave de archivos (y su AAD).
        const bytes = await readAt(handle, dataStart + entry.offset, entry.length);
        const destination = localFile(path);
        destination.parentDirectory.create({ intermediates: true, idempotent: true });
        destination.write(bytes);
      }
    }
  };
}

// Importa un respaldo de esta bóveda. Gana la versión más reciente de cada documento o clave,
// así que importar dos veces, o un respaldo viejo, no pisa lo nuevo.
export async function importBackup(
  db: SQLiteDatabase,
  keys: Subkeys,
  file: File,
  opened: OpenedBackup,
): Promise<ImportCounts> {
  const manifest = openManifest(crypto, keys.metaKey, opened.header.manifest);
  const counts: ImportCounts = { documents: 0, secrets: 0, skipped: 0 };
  const handle = file.open(FileMode.ReadOnly);
  try {
    const obtain = pagesFromBackup(handle, opened.dataStart, manifest.files);
    for (const row of manifest.documents) {
      const remote = {
        id: row.id,
        payload_enc: row.payload,
        updated_at: row.updatedAt,
        deleted_at: null,
        server_updated_at: '',
      };
      if ((await applyRemoteDocument(db, keys, remote, obtain)) === 'skipped') {
        counts.skipped++;
        continue;
      }
      counts.documents++;
      // Pendiente de subir: la nube puede no tenerlo (si ya lo tiene, no cambia nada).
      await db.runAsync('UPDATE documents SET synced_at = NULL WHERE id = ?', row.id);
      await db.runAsync('UPDATE document_pages SET synced_at = NULL WHERE document_id = ?', row.id);
    }
  } finally {
    handle.close();
  }
  for (const row of manifest.secrets) {
    const remote = {
      id: row.id,
      payload_enc: row.payload,
      updated_at: row.updatedAt,
      deleted_at: null,
    };
    if (!(await applyRemoteSecret(db, keys, remote))) {
      counts.skipped++;
      continue;
    }
    counts.secrets++;
    await db.runAsync('UPDATE secrets SET synced_at = NULL WHERE id = ?', row.id);
  }
  afterLocalChange(db); // avisos de vencimiento y renovación, y subir a la nube
  return counts;
}
