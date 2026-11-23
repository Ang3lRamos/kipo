import { Directory, File, Paths } from 'expo-file-system';

import { vaultDbName } from '@/db/open-encrypted';

// Cuánto ocupa Kipo en el teléfono. Todo lo que se mide está cifrado.
export type StorageUsage = { files: number; database: number };

function directorySize(dir: Directory): number {
  if (!dir.exists) return 0;
  let total = 0;
  for (const item of dir.list()) {
    total += item instanceof Directory ? directorySize(item) : (item.size ?? 0);
  }
  return total;
}

export function measureStorage(): StorageUsage {
  const db = new File(Paths.document, 'SQLite', vaultDbName);
  const extras = ['-wal', '-shm'].map(
    (suffix) => new File(Paths.document, 'SQLite', vaultDbName + suffix),
  );
  const database = [db, ...extras].reduce((sum, f) => sum + (f.exists ? f.size : 0), 0);
  return { files: directorySize(new Directory(Paths.document, 'docs')), database };
}
