import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { updateDocument } from '@/db/documents-repo';
import { DocumentForm } from '@/features/documents/document-form';
import { formValuesFrom } from '@/features/documents/form-values';
import { useDocumentDetail } from '@/features/documents/use-documents';
import { afterLocalChange } from '@/sync/after-local-change';
import { EmptyState } from '@/ui/empty-state';
import { Screen, ScreenHeader } from '@/ui/screen';

export default function EditDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { data, loading } = useDocumentDetail(id);

  return (
    <Screen>
      <ScreenHeader title="Editar documento" />
      {loading ? null : !data.doc ? (
        <EmptyState mood="buscando" title="Este documento ya no existe" />
      ) : (
        <DocumentForm
          initialValues={formValuesFrom(data.doc)}
          submitLabel="Guardar cambios"
          onSubmit={async (input) => {
            await updateDocument(db, id, input);
            afterLocalChange(db); // reprograma avisos y sube el cambio
            router.back();
          }}
        />
      )}
    </Screen>
  );
}
