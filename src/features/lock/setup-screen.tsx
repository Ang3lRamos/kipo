import { useState } from 'react';
import { Text } from 'react-native';

import { wipe } from '@/crypto/bytes';
import { formatRecoveryKey } from '@/crypto/recovery-key';
import type { VaultRecord } from '@/crypto/vault';
import { canUseBiometrics, enableBiometricUnlock } from '@/crypto/vault-store';
import { Button } from '@/ui/button';
import { TextField } from '@/ui/text-field';
import { useTheme } from '@/ui/theme';

import { LockLayout } from './lock-layout';
import { NewPasswordForm } from './new-password-form';
import { RecoveryKeyView } from './recovery-key-view';
import { openSession, persistVault, prepareVault } from './vault-actions';
import { useVault } from './vault-context';

type Draft = { record: VaultRecord; dek: Uint8Array; recoveryText: string };
type Step = 'intro' | 'password' | 'recovery' | 'confirm' | 'biometrics';

export function SetupScreen() {
  const theme = useTheme();
  const { unlock } = useVault();
  const [step, setStep] = useState<Step>('intro');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | undefined>();

  const createDraft = async (password: string) => {
    setBusy(true);
    try {
      const { record, dek, recoveryKey } = await prepareVault(password);
      setDraft({ record, dek, recoveryText: formatRecoveryKey(recoveryKey) });
      wipe(recoveryKey);
      setStep('recovery');
    } finally {
      setBusy(false);
    }
  };

  const confirmRecovery = async () => {
    if (!draft) return;
    const lastGroup = draft.recoveryText.split('-').pop() ?? '';
    if (typed.trim().toUpperCase() !== lastGroup) {
      return setError('No coincide. Revisa lo que anotaste.');
    }
    await persistVault(draft.record); // solo ahora queda guardada la bóveda
    if (canUseBiometrics()) setStep('biometrics');
    else await finish(false);
  };

  const finish = async (withBiometrics = false) => {
    if (!draft) return;
    if (withBiometrics) {
      try {
        await enableBiometricUnlock(draft.dek);
      } catch (e) {
        console.warn('No se activó la huella', e);
      }
    }
    unlock(openSession(draft.dek, draft.record));
  };

  if (step === 'intro') {
    return (
      <LockLayout
        title="Protege tu bóveda"
        subtitle="Todo en Kipo se cifra con una contraseña maestra que solo tú conoces. No se guarda en ningún lado: si la olvidas y pierdes la clave de recuperación, nadie podrá recuperar tus documentos."
      >
        <Button label="Crear contraseña maestra" onPress={() => setStep('password')} />
      </LockLayout>
    );
  }

  if (step === 'password' || !draft) {
    return (
      <LockLayout
        title="Contraseña maestra"
        subtitle="Usa una frase larga que puedas recordar, distinta de tus otras contraseñas."
      >
        <NewPasswordForm submitLabel="Continuar" busy={busy} onSubmit={createDraft} />
      </LockLayout>
    );
  }

  if (step === 'recovery') {
    return (
      <LockLayout
        title="Clave de recuperación"
        subtitle="Anótala en papel y guárdala con tus documentos importantes. Es la única forma de entrar si olvidas la contraseña. No le tomes foto."
      >
        <RecoveryKeyView formatted={draft.recoveryText} />
        <Button label="Ya la anoté" onPress={() => setStep('confirm')} />
      </LockLayout>
    );
  }

  if (step === 'confirm') {
    return (
      <LockLayout title="Confirma la clave" subtitle="Escribe el último grupo de 4 caracteres.">
        <TextField
          label="Último grupo"
          value={typed}
          onChangeText={setTyped}
          autoCapitalize="characters"
          autoCorrect={false}
          error={error}
        />
        <Button label="Confirmar" onPress={confirmRecovery} />
        <Button
          label="Ver la clave otra vez"
          variant="secondary"
          onPress={() => setStep('recovery')}
        />
      </LockLayout>
    );
  }

  return (
    <LockLayout
      title="Desbloqueo con huella"
      subtitle="Puedes abrir Kipo con tu huella en lugar de escribir la contraseña cada vez."
    >
      <Button label="Activar huella" onPress={() => finish(true)} />
      <Button label="Ahora no" variant="secondary" onPress={() => finish(false)} />
      <Text style={{ color: theme.muted, textAlign: 'center' }}>
        Puedes cambiarlo después en Seguridad.
      </Text>
    </LockLayout>
  );
}
