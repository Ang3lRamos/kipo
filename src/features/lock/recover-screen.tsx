import { useState } from 'react';

import { InvalidRecoveryKeyError, WrongRecoveryKeyError } from '@/crypto/errors';
import type { VaultRecord } from '@/crypto/vault';
import { Button } from '@/ui/button';
import { TextField } from '@/ui/text-field';

import { LockLayout } from './lock-layout';
import { NewPasswordForm } from './new-password-form';
import { sessionFromRecovery } from './vault-actions';
import { useVault } from './vault-context';

type Props = { record: VaultRecord; onCancel: () => void };

export function RecoverScreen({ record, onCancel }: Props) {
  const { unlock } = useVault();
  const [recoveryText, setRecoveryText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const submit = async (newPassword: string) => {
    setBusy(true);
    setError(undefined);
    try {
      unlock(await sessionFromRecovery(record, recoveryText, newPassword));
    } catch (e) {
      if (e instanceof InvalidRecoveryKeyError) setError('La clave tiene un error de digitación.');
      else if (e instanceof WrongRecoveryKeyError) setError('Esa clave no es la de esta bóveda.');
      else {
        setError('No se pudo recuperar el acceso.');
        console.error('Error en la recuperación', e);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <LockLayout
      title="Recuperar acceso"
      subtitle="Escribe la clave de recuperación que anotaste y elige una contraseña maestra nueva."
    >
      <TextField
        label="Clave de recuperación"
        placeholder="XXXX-XXXX-XXXX-…"
        value={recoveryText}
        onChangeText={setRecoveryText}
        autoCapitalize="characters"
        autoCorrect={false}
        multiline
        error={error}
      />
      <NewPasswordForm submitLabel="Recuperar y desbloquear" busy={busy} onSubmit={submit} />
      <Button label="Volver" variant="secondary" onPress={onCancel} />
    </LockLayout>
  );
}
