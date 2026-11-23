import { getDocumentAsync } from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { InvalidBackupError } from '@/backup/backup-format';
import { readBackup, type OpenedBackup } from '@/backup/import-backup';
import { setPendingImport } from '@/backup/pending-import';
import { WrongPasswordError } from '@/crypto/errors';
import { saveVaultRecord } from '@/crypto/vault-store';
import { formatDate } from '@/features/documents/dates';
import { discardTemp } from '@/files/local-store';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { AppText } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { useTheme } from '@/ui/theme-provider';

import { LockLayout } from './lock-layout';
import { sessionFromPassword } from './vault-actions';
import { useVault } from './vault-context';

type Picked = { uri: string; opened: OpenedBackup };

// Teléfono nuevo sin nube: elegir el .kipo → contraseña maestra → la bóveda queda en este
// teléfono y el contenido se importa apenas se abre la base.
export function RestoreFileScreen({ onCancel }: { onCancel: () => void }) {
  const theme = useTheme();
  const { unlock } = useVault();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const pick = async () => {
    setMessage(null);
    const result = await getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    const uri = result.canceled ? null : (result.assets[0]?.uri ?? null);
    if (!uri) return;
    try {
      if (picked) discardTemp(picked.uri);
      setPicked({ uri, opened: await readBackup(new File(uri)) });
    } catch (e) {
      discardTemp(uri);
      setPicked(null);
      setMessage(e instanceof InvalidBackupError ? e.message : 'No se pudo leer el archivo.');
    }
  };

  const restore = async () => {
    if (!picked) return;
    setBusy(true);
    setMessage(null);
    try {
      // La contraseña se comprueba antes de guardar nada en el teléfono.
      const session = await sessionFromPassword(picked.opened.record, password);
      await saveVaultRecord(picked.opened.record);
      setPendingImport(picked);
      unlock(session);
    } catch (e) {
      const wrong = e instanceof WrongPasswordError;
      if (!wrong) console.error('Error al restaurar desde archivo', e);
      setMessage(wrong ? 'Contraseña maestra incorrecta.' : 'No se pudo restaurar el respaldo.');
    } finally {
      setPassword('');
      setBusy(false);
    }
  };

  const cancel = () => {
    if (picked) discardTemp(picked.uri);
    onCancel();
  };

  return (
    <LockLayout
      title="Restaurar desde un archivo"
      subtitle="Elige tu respaldo .kipo y escribe la contraseña maestra con la que lo creaste."
      mood="buscando"
      kipoSize={110}
    >
      <Card>
        <View style={styles.form}>
          <Button
            variant={picked ? 'secondary' : 'primary'}
            label={picked ? 'Elegir otro archivo' : 'Elegir archivo .kipo'}
            onPress={() => void pick()}
          />
          {picked ? (
            <>
              <AppText color="textMuted">
                {`Respaldo del ${formatDate(picked.opened.header.createdAt.slice(0, 10))}`}
              </AppText>
              <TextField
                label="Contraseña maestra"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Button
                label="Restaurar"
                onPress={() => void restore()}
                loading={busy}
                disabled={busy || !password}
              />
            </>
          ) : null}
          {message ? <AppText color={theme.colors.danger.text}>{message}</AppText> : null}
        </View>
      </Card>
      <Button variant="ghost" label="Volver" onPress={cancel} />
    </LockLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
});
