import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { createDocument } from '@/db/documents-repo';
import { DocumentForm } from '@/features/documents/document-form';
import { emptyFormValues } from '@/features/documents/form-values';

export default function NewDocumentScreen() {
  const db = useSQLiteContext();

  return (
    <DocumentForm
      initialValues={emptyFormValues}
      submitLabel="Guardar documento"
      onSubmit={async (input) => {
        const id = await createDocument(db, input);
        router.replace({ pathname: '/documents/[id]', params: { id } });
      }}
    />
  );
}
