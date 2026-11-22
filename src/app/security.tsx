import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { WrongPasswordError } from '@/crypto/errors';
import { canUseBiometrics } from '@/crypto/vault-store';
import { NewPasswordForm } from '@/features/lock/new-password-form';
import { changeMasterPassword } from '@/features/lock/vault-actions';
import { useSession, useVault } from '@/features/lock/vault-context';
import { Button } from '@/ui/button';
import { Section } from '@/ui/section';
import { TextField } from '@/ui/text-field';
import { useTheme } from '@/ui/theme';

export default function SecurityScreen() {
  const theme = useTheme();
  const session = useSession();
  const { state, lock, updateRecord, setBiometric } = useVault();
  const biometricEnabled = state.status === 'unlocked' && state.biometricEnabled;
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

  const toggleBiometric = (enabled: boolean) => {
    setBiometric(enabled).catch((e: unknown) => {
      console.warn('No se cambió la huella', e);
      setMessage({ text: 'No se pudo cambiar el desbloqueo con huella.', ok: false });
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {canUseBiometrics() ? (
        <Section title="Desbloqueo">
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.text }]}>Usar huella</Text>
            <Switch value={biometricEnabled} onValueChange={toggleBiometric} />
          </View>
        </Section>
      ) : null}

      <Section title="Cambiar contraseña maestra">
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
        <Text style={{ color: theme.muted }}>
          Tu clave de recuperación sigue sirviendo. Los documentos no se vuelven a cifrar.
        </Text>
      </Section>

      {message ? (
        <Text style={{ color: message.ok ? theme.primary : theme.danger }}>{message.text}</Text>
      ) : null}

      <Button label="🔒 Bloquear ahora" variant="secondary" onPress={() => lock()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, padding: 16, paddingBottom: 48 },
  label: { fontSize: 16 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
});
