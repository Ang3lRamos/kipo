import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { updateDocument } from '@/db/documents-repo';
import { DocumentForm } from '@/features/documents/document-form';
import { formValuesFrom } from '@/features/documents/form-values';
import { useDocumentDetail } from '@/features/documents/use-documents';
import { EmptyState } from '@/ui/empty-state';

export default function EditDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { data, loading } = useDocumentDetail(id);

  if (loading) return null;
  if (!data.doc) return <EmptyState title="Este documento ya no existe" />;

  return (
    <DocumentForm
      initialValues={formValuesFrom(data.doc)}
      submitLabel="Guardar cambios"
      onSubmit={async (input) => {
        await updateDocument(db, id, input);
        router.back();
      }}
    />
  );
}
