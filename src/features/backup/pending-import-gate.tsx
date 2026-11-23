import { File } from 'expo-file-system';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { importBackup } from '@/backup/import-backup';
import { hasPendingImport, takePendingImport } from '@/backup/pending-import';
import { useSession } from '@/features/lock/vault-context';
import { discardTemp } from '@/files/local-store';
import { EmptyState } from '@/ui/empty-state';
import { useFeedback } from '@/ui/feedback';
import { Screen } from '@/ui/screen';

import { describeImport } from './describe';

// Si se restauró desde un archivo, lo importa antes de mostrar la app (así las listas ya
// salen con todo).
export function PendingImportGate({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const { keys } = useSession();
  const { toast } = useFeedback();
  const [busy, setBusy] = useState(hasPendingImport);

  useEffect(() => {
    const pending = takePendingImport();
    if (!pending) return;
    importBackup(db, keys, new File(pending.uri), pending.opened)
      .then((counts) => toast(describeImport(counts)))
      .catch((error: unknown) => {
        console.error('No se pudo importar el respaldo', error);
        toast('No se pudo importar el respaldo', 'error');
      })
      .finally(() => {
        discardTemp(pending.uri);
        setBusy(false);
      });
  }, [db, keys, toast]);

  if (busy) {
    return (
      <Screen>
        <EmptyState
          mood="buscando"
          title="Restaurando tu respaldo…"
          message="Esto tarda unos segundos. No cierres la app."
        />
      </Screen>
    );
  }
  return children;
}
