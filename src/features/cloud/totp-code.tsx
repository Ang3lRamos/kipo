import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { signOut, verifyTotp } from '@/sync/cloud-auth';
import { Button } from '@/ui/button';
import { AppText } from '@/ui/text';
import { TextField } from '@/ui/text-field';

type Props = { factorId: string; run: (action: () => Promise<void>) => Promise<boolean> };

// Segundo paso del inicio de sesión: el código de la app de autenticación.
export function TotpCode({ factorId, run }: Props) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    await run(() => verifyTotp(factorId, code));
    setCode('');
    setBusy(false);
  };

  return (
    <View style={styles.container}>
      <AppText color="textMuted">
        Escribe el código de 6 dígitos de tu app de autenticación.
      </AppText>
      <TextField
        label="Código"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        textContentType="oneTimeCode"
      />
      <Button
        label="Verificar"
        onPress={confirm}
        loading={busy}
        disabled={busy || code.length < 6}
      />
      <Button variant="ghost" label="Usar otra cuenta" onPress={() => void run(signOut)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
});
