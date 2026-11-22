import { Fingerprint, Lock } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { WrongPasswordError } from '@/crypto/errors';
import type { VaultRecord } from '@/crypto/vault';
import { Button } from '@/ui/button';
import type { KipoMood } from '@/ui/kipo/kipo-types';
import { AppText } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { useTheme } from '@/ui/theme-provider';

import { LockLayout } from './lock-layout';
import { RecoverScreen } from './recover-screen';
import { sessionFromPassword, type Session } from './vault-actions';
import { useVault } from './vault-context';

type Props = { record: VaultRecord; biometricEnabled: boolean; notice?: string | undefined };

const wakeMs = 350;

export function UnlockScreen({ record, biometricEnabled, notice }: Props) {
  const theme = useTheme();
  const { unlock, biometricSession } = useVault();
  const [usePassword, setUsePassword] = useState(!biometricEnabled);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(notice);
  const [recovering, setRecovering] = useState(false);
  const [mood, setMood] = useState<KipoMood>('dormido');
  const [bounceKey, setBounceKey] = useState(0);
  const prompted = useRef(false);

  // Despertar: Kipo pasa de dormido a feliz con un saltito y luego entra a la app.
  const wakeAndUnlock = useCallback(
    (session: Session) => {
      setMood('feliz');
      setBounceKey((k) => k + 1);
      setTimeout(() => unlock(session), wakeMs);
    },
    [unlock],
  );

  const tryBiometrics = useCallback(async () => {
    const session = await biometricSession();
    if (session) wakeAndUnlock(session);
  }, [biometricSession, wakeAndUnlock]);

  // Ofrece la huella una sola vez, salvo que haya un aviso de error (evita pedirla en bucle).
  useEffect(() => {
    if (!biometricEnabled || notice || prompted.current) return;
    prompted.current = true;
    void tryBiometrics();
  }, [biometricEnabled, notice, tryBiometrics]);

  if (recovering) return <RecoverScreen record={record} onCancel={() => setRecovering(false)} />;

  const submit = async () => {
    if (!password) return;
    setBusy(true);
    setError(undefined);
    try {
      wakeAndUnlock(await sessionFromPassword(record, password));
    } catch (e) {
      const wrong = e instanceof WrongPasswordError;
      setError(wrong ? 'Contraseña incorrecta.' : 'No se pudo desbloquear.');
      if (!wrong) console.error('Error al desbloquear', e);
    } finally {
      setPassword('');
      setBusy(false);
    }
  };

  return (
    <LockLayout title="Hola de nuevo" mood={mood} kipoSize={180} bounceKey={bounceKey}>
      {usePassword ? (
        <View style={styles.form}>
          <TextField
            label="Contraseña maestra"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            textContentType="password"
            onSubmitEditing={submit}
            error={error}
          />
          <Button label="Desbloquear" onPress={submit} loading={busy} disabled={busy} />
        </View>
      ) : (
        <View style={styles.center}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Desbloquear con huella"
            onPress={() => void tryBiometrics()}
            style={({ pressed }) => [
              styles.fingerprint,
              { backgroundColor: theme.colors.surface },
              theme.shadow.float,
              pressed && styles.pressed,
            ]}
          >
            <Fingerprint color={theme.colors.location.icon} size={52} strokeWidth={1.8} />
          </Pressable>
          {error ? <AppText color={theme.colors.danger.text}>{error}</AppText> : null}
        </View>
      )}
      <View style={styles.links}>
        {biometricEnabled ? (
          <Button
            variant="ghost"
            label={usePassword ? 'Usar huella' : 'Usar contraseña maestra'}
            onPress={() => setUsePassword((v) => !v)}
          />
        ) : null}
        <Button variant="ghost" label="Olvidé mi contraseña" onPress={() => setRecovering(true)} />
      </View>
      <View style={styles.note}>
        <Lock color={theme.colors.location.text} size={14} strokeWidth={2} />
        <AppText variant="small" color={theme.colors.location.text}>
          Cifrado en tu teléfono
        </AppText>
      </View>
    </LockLayout>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 12 },
  fingerprint: {
    alignItems: 'center',
    borderRadius: 56,
    height: 112,
    justifyContent: 'center',
    width: 112,
  },
  form: { gap: 14 },
  links: { alignItems: 'center' },
  note: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center' },
  pressed: { opacity: 0.7 },
});
