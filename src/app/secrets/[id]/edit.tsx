import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { updateSecret } from '@/db/secrets-repo';
import { SecretForm } from '@/features/secrets/secret-form';
import { useSecret } from '@/features/secrets/use-secrets';
import { afterLocalChange } from '@/sync/after-local-change';
import { EmptyState } from '@/ui/empty-state';
import { Screen, ScreenHeader } from '@/ui/screen';

export default function EditSecretScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { data: secret, loading } = useSecret(id);

  return (
    <Screen>
      <ScreenHeader title="Editar clave" />
      {loading ? null : !secret ? (
        <EmptyState mood="buscando" title="Esta clave ya no existe" />
      ) : (
        <SecretForm
          initial={{ title: secret.title, data: secret.data }}
          canChangeKind={false}
          onSubmit={async (input) => {
            await updateSecret(db, id, input);
            afterLocalChange(db);
            router.back();
          }}
        />
      )}
    </Screen>
  );
}
