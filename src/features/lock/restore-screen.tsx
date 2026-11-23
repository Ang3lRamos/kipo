import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { WrongPasswordError } from '@/crypto/errors';
import { saveVaultRecord } from '@/crypto/vault-store';
import { CloudAccountSteps } from '@/features/cloud/cloud-account';
import { useCloud } from '@/features/cloud/use-cloud';
import { fetchRemoteVault } from '@/sync/cloud-api';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { AppText } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { useTheme } from '@/ui/theme-provider';

import { LockLayout } from './lock-layout';
import { sessionFromPassword } from './vault-actions';
import { useVault } from './vault-context';

// Teléfono nuevo: login + segundo factor → bajar la bóveda → contraseña maestra → entrar.
// Los documentos se descargan solos en la primera sincronización.
export function RestoreScreen({ onCancel }: { onCancel: () => void }) {
  const theme = useTheme();
  const { unlock } = useVault();
  const { status, error, run } = useCloud();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const restore = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const record = await fetchRemoteVault();
      if (!record) {
        setMessage('Esta cuenta todavía no tiene una bóveda respaldada.');
        return;
      }
      // La contraseña se comprueba antes de guardar nada en el teléfono.
      const session = await sessionFromPassword(record, password);
      await saveVaultRecord(record);
      unlock(session);
    } catch (e) {
      const wrong = e instanceof WrongPasswordError;
      if (!wrong) console.error('Error al restaurar', e);
      setMessage(wrong ? 'Contraseña maestra incorrecta.' : 'No se pudo restaurar la bóveda.');
    } finally {
      setPassword('');
      setBusy(false);
    }
  };

  return (
    <LockLayout
      title="Restaurar desde la nube"
      subtitle="Entra a tu cuenta y luego escribe tu contraseña maestra para descifrar todo."
      mood="buscando"
      kipoSize={110}
    >
      <Card>
        {status?.kind === 'ready' ? (
          <View style={styles.form}>
            <AppText color="textMuted">{`Cuenta: ${status.email}`}</AppText>
            <TextField
              label="Contraseña maestra"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            {message ? <AppText color={theme.colors.danger.text}>{message}</AppText> : null}
            <Button
              label="Restaurar"
              onPress={restore}
              loading={busy}
              disabled={busy || !password}
            />
          </View>
        ) : (
          <CloudAccountSteps status={status} error={error} run={run} />
        )}
      </Card>
      <Button variant="ghost" label="Volver" onPress={onCancel} />
    </LockLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
});
