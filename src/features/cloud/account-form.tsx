import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { signIn, signUp } from '@/sync/cloud-auth';
import { Button } from '@/ui/button';
import { AppText } from '@/ui/text';
import { TextField } from '@/ui/text-field';

type Props = { run: (action: () => Promise<void>) => Promise<boolean> };

// Correo y contraseña de la cuenta en la nube. Es DISTINTA de la contraseña maestra:
// la de la cuenta solo da acceso a datos cifrados; la maestra es la que los descifra.
export function AccountForm({ run }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setNotice(null);
    const ok = await run(() => (mode === 'signin' ? signIn : signUp)(email, password));
    if (ok && mode === 'signup') {
      setNotice(
        'Si te pide confirmar el correo, abre el enlace que te llegó y luego inicia sesión.',
      );
      setMode('signin');
    }
    setPassword('');
    setBusy(false);
  };

  return (
    <View style={styles.form}>
      <TextField
        label="Correo"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label="Contraseña de la cuenta"
        hint="Usa una distinta de tu contraseña maestra."
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        textContentType={mode === 'signup' ? 'newPassword' : 'password'}
      />
      {notice ? <AppText color="textMuted">{notice}</AppText> : null}
      <Button
        label={mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
        onPress={submit}
        loading={busy}
        disabled={busy || !email || !password}
      />
      <Button
        variant="ghost"
        label={mode === 'signin' ? 'No tengo cuenta: crear una' : 'Ya tengo cuenta'}
        onPress={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
});
