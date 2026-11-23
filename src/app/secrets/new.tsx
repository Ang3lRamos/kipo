import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { createSecret } from '@/db/secrets-repo';
import { SecretForm } from '@/features/secrets/secret-form';
import { emptySecretData } from '@/secrets/secret-rules';
import { afterLocalChange } from '@/sync/after-local-change';
import { Screen, ScreenHeader } from '@/ui/screen';

export default function NewSecretScreen() {
  const db = useSQLiteContext();
  return (
    <Screen>
      <ScreenHeader title="Nueva clave" />
      <SecretForm
        initial={{ title: '', data: emptySecretData('login') }}
        canChangeKind
        onSubmit={async (input) => {
          const id = await createSecret(db, input);
          afterLocalChange(db); // sube la clave cifrada
          router.replace({ pathname: '/secrets/[id]', params: { id } });
        }}
      />
    </Screen>
  );
}
