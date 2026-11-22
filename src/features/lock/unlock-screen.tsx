import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { WrongPasswordError } from '@/crypto/errors';
import type { VaultRecord } from '@/crypto/vault';
import { Button } from '@/ui/button';
import { TextField } from '@/ui/text-field';

import { LockLayout } from './lock-layout';
import { RecoverScreen } from './recover-screen';
import { sessionFromPassword } from './vault-actions';
import { useVault } from './vault-context';

type Props = { record: VaultRecord; biometricEnabled: boolean };

export function UnlockScreen({ record, biometricEnabled }: Props) {
  const { unlock, unlockWithBiometrics } = useVault();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [recovering, setRecovering] = useState(false);

  // Ofrece la huella apenas aparece la pantalla.
  useEffect(() => {
    if (biometricEnabled) void unlockWithBiometrics();
  }, [biometricEnabled, unlockWithBiometrics]);

  if (recovering) return <RecoverScreen record={record} onCancel={() => setRecovering(false)} />;

  const submit = async () => {
    if (!password) return;
    setBusy(true);
    setError(undefined);
    try {
      unlock(await sessionFromPassword(record, password));
    } catch (e) {
      setError(
        e instanceof WrongPasswordError ? 'Contraseña incorrecta.' : 'No se pudo desbloquear.',
      );
      if (!(e instanceof WrongPasswordError)) console.error('Error al desbloquear', e);
    } finally {
      setPassword('');
      setBusy(false);
    }
  };

  return (
    <LockLayout title="Kipo está bloqueado" subtitle="Escribe tu contraseña maestra.">
      <TextField
        label="Contraseña maestra"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={!biometricEnabled}
        textContentType="password"
        onSubmitEditing={submit}
        error={error}
      />
      {busy ? <ActivityIndicator /> : null}
      <Button label="Desbloquear" onPress={submit} disabled={busy} />
      {biometricEnabled ? (
        <Button
          label="Usar huella"
          variant="secondary"
          onPress={() => void unlockWithBiometrics()}
        />
      ) : null}
      <Button
        label="Olvidé mi contraseña"
        variant="secondary"
        onPress={() => setRecovering(true)}
      />
    </LockLayout>
  );
}
