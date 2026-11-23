import type { SQLiteDatabase } from 'expo-sqlite';
import { Alert } from 'react-native';

import { softDeleteDocument } from '@/db/documents-repo';
import { softDeleteSecret } from '@/db/secrets-repo';
import { deleteDocumentFiles } from '@/files/local-store';
import { afterLocalChange } from '@/sync/after-local-change';

type Kind = 'documents' | 'secrets';

const words: Record<Kind, { one: string; many: string }> = {
  documents: { one: 'documento', many: 'documentos' },
  secrets: { one: 'clave', many: 'claves' },
};

async function remove(db: SQLiteDatabase, kind: Kind, ids: string[]): Promise<void> {
  // withTransactionAsync usa la conexión que ya tiene la llave de SQLCipher.
  await db.withTransactionAsync(async () => {
    for (const id of ids) {
      if (kind === 'documents') await softDeleteDocument(db, id);
      else await softDeleteSecret(db, id);
    }
  });
  // Las filas quedan para propagar el borrado a la nube; los archivos locales se borran ya.
  if (kind === 'documents') ids.forEach(deleteDocumentFiles);
  afterLocalChange(db); // cancela sus avisos y sube los borrados
}

// Pide confirmación y borra los elegidos. `done` se llama solo si se borraron.
export function confirmBulkDelete(db: SQLiteDatabase, kind: Kind, ids: string[], done: () => void) {
  if (ids.length === 0) return;
  const w = words[kind];
  const what = ids.length === 1 ? `1 ${w.one}` : `${ids.length} ${w.many}`;
  Alert.alert(`Eliminar ${what}`, 'No se puede deshacer, tampoco en la copia de la nube.', [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Eliminar',
      style: 'destructive',
      onPress: () => {
        remove(db, kind, ids)
          .then(done)
          .catch((error: unknown) => {
            console.error('No se pudo eliminar', error);
            Alert.alert('No se pudo eliminar', 'Inténtalo de nuevo.');
          });
      },
    },
  ]);
}
