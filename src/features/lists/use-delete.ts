import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { softDeleteDocuments } from '@/db/documents-repo';
import { softDeleteSecrets } from '@/db/secrets-repo';
import { deleteDocumentFiles } from '@/files/local-store';
import { afterLocalChange } from '@/sync/after-local-change';
import { useFeedback } from '@/ui/feedback';

type Kind = 'documents' | 'secrets';

const words: Record<Kind, { one: string; many: string; done: string; doneMany: string }> = {
  documents: {
    one: 'documento',
    many: 'documentos',
    done: 'Documento eliminado',
    doneMany: 'documentos eliminados',
  },
  secrets: { one: 'clave', many: 'claves', done: 'Clave eliminada', doneMany: 'claves eliminadas' },
};

// Confirmar → borrar → avisar. Devuelve true si se borró. `name` es el título cuando es uno.
export function useDelete(kind: Kind) {
  const db = useSQLiteContext();
  const { confirm, toast } = useFeedback();

  return useCallback(
    async (ids: string[], name?: string): Promise<boolean> => {
      if (ids.length === 0) return false;
      const w = words[kind];
      const what = name ? `"${name}"` : ids.length === 1 ? `1 ${w.one}` : `${ids.length} ${w.many}`;
      const ok = await confirm({
        title: `¿Eliminar ${what}?`,
        message: 'No se puede deshacer, tampoco en la copia de la nube.',
        confirmLabel: 'Eliminar',
        destructive: true,
      });
      if (!ok) return false;
      try {
        if (kind === 'documents') await softDeleteDocuments(db, ids);
        else await softDeleteSecrets(db, ids);
        // Las filas quedan para propagar el borrado a la nube; los archivos locales se borran ya.
        if (kind === 'documents') ids.forEach(deleteDocumentFiles);
        afterLocalChange(db); // cancela sus avisos y sube los borrados
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast(ids.length === 1 ? w.done : `${ids.length} ${w.doneMany}`);
        return true;
      } catch (error) {
        console.error('No se pudo eliminar', error);
        toast('No se pudo eliminar. Inténtalo de nuevo.', 'error');
        return false;
      }
    },
    [db, kind, confirm, toast],
  );
}
