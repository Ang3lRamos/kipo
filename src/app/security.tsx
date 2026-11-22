import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { WrongPasswordError } from '@/crypto/errors';
import { NewPasswordForm } from '@/features/lock/new-password-form';
import { changeMasterPassword } from '@/features/lock/vault-actions';
import { useSession, useVault } from '@/features/lock/vault-context';
import { Card } from '@/ui/card';
import { Screen, ScreenHeader } from '@/ui/screen';
import { AppText } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { useTheme } from '@/ui/theme-provider';

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const session = useSession();
  const { updateRecord } = useVault();
  const [current, setCurrent] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [formKey, setFormKey] = useState(0);

  const change = async (newPassword: string) => {
    setBusy(true);
    setMessage(null);
    try {
      updateRecord(await changeMasterPassword(session, current, newPassword));
      setMessage({ text: 'Contraseña cambiada.', ok: true });
      setCurrent('');
      setFormKey((k) => k + 1);
    } catch (e) {
      const wrong = e instanceof WrongPasswordError;
      if (!wrong) console.error('Error al cambiar la contraseña', e);
      setMessage({
        text: wrong ? 'La contraseña actual no es correcta.' : 'No se pudo cambiar.',
        ok: false,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Contraseña maestra" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Card>
          <TextField
            label="Contraseña actual"
            value={current}
            onChangeText={setCurrent}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <NewPasswordForm
            key={formKey}
            submitLabel="Cambiar contraseña"
            busy={busy}
            onSubmit={change}
          />
          <AppText variant="small" color="textMuted">
            Tu clave de recuperación sigue sirviendo. Los documentos no se vuelven a cifrar.
          </AppText>
        </Card>
        {message ? (
          <AppText color={message.ok ? theme.colors.accentText : theme.colors.danger.text}>
            {message.text}
          </AppText>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, padding: 16, paddingBottom: 32 },
});
