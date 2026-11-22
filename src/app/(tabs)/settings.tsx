import { router } from 'expo-router';
import { Fingerprint, KeyRound, Lock, Palette, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch } from 'react-native';

import { canUseBiometrics } from '@/crypto/vault-store';
import { useVault } from '@/features/lock/vault-context';
import { SettingsRow } from '@/features/settings/settings-row';
import { Card } from '@/ui/card';
import { Screen } from '@/ui/screen';
import { AppText } from '@/ui/text';
import { useTheme, useThemePreference } from '@/ui/theme-provider';
import { palettes } from '@/ui/themes';

const modeLabels = { light: 'claro', dark: 'oscuro', system: 'según el sistema' } as const;

export default function SettingsScreen() {
  const theme = useTheme();
  const { preference } = useThemePreference();
  const { state, lock, setBiometric } = useVault();
  const biometricEnabled = state.status === 'unlocked' && state.biometricEnabled;
  const [error, setError] = useState<string | null>(null);
  const paletteLabel = palettes.find((p) => p.name === preference.palette)?.label ?? '';

  const toggleBiometric = (enabled: boolean) => {
    setError(null);
    setBiometric(enabled).catch((e: unknown) => {
      console.warn('No se cambió la huella', e);
      setError('No se pudo cambiar el desbloqueo con huella.');
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="h1">Ajustes</AppText>

        <Card>
          <AppText variant="h3">Apariencia</AppText>
          <SettingsRow
            icon={Palette}
            label="Color y modo"
            detail={`${paletteLabel}, ${modeLabels[preference.mode]}`}
            onPress={() => router.push('/theme')}
          />
        </Card>

        <Card>
          <AppText variant="h3">Seguridad</AppText>
          {canUseBiometrics() ? (
            <SettingsRow
              icon={Fingerprint}
              label="Desbloquear con huella"
              right={<Switch value={biometricEnabled} onValueChange={toggleBiometric} />}
            />
          ) : null}
          <SettingsRow
            icon={KeyRound}
            label="Cambiar contraseña maestra"
            onPress={() => router.push('/security')}
          />
          <SettingsRow icon={Lock} label="Bloquear ahora" onPress={() => lock()} />
          {error ? <AppText color={theme.colors.danger.text}>{error}</AppText> : null}
        </Card>

        <Card tint={theme.colors.location.bg}>
          <SettingsRow
            icon={ShieldCheck}
            label="Cifrado en tu teléfono"
            detail="Tus documentos se cifran con AES-256 antes de guardarse. Nadie más tiene la llave."
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, padding: 16, paddingBottom: 32 },
});
