import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Bell,
  Cloud,
  Fingerprint,
  KeyRound,
  Lock,
  Palette,
  ShieldCheck,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Switch } from 'react-native';

import { canUseBiometrics } from '@/crypto/vault-store';
import { useVault } from '@/features/lock/vault-context';
import { ReadExistingRow } from '@/features/ocr/read-existing-row';
import { BackupFileRows } from '@/features/backup/backup-file-rows';
import { LockSettings } from '@/features/settings/lock-settings';
import { SettingsRow } from '@/features/settings/settings-row';
import { StorageRow } from '@/features/settings/storage-row';
import { describeOffsets } from '@/notifications/reminder-plan';
import { loadReminderOffsets } from '@/notifications/sync-reminders';
import { useFocusedQuery } from '@/ui/use-focused-query';
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
  const db = useSQLiteContext();
  const loadOffsets = useCallback(() => loadReminderOffsets(db), [db]);
  const { data: offsets } = useFocusedQuery(loadOffsets, [] as number[]);

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

        <LockSettings />

        <Card>
          <AppText variant="h3">Respaldo</AppText>
          <SettingsRow
            icon={Cloud}
            label="Respaldo en la nube"
            detail="Cifrado de extremo a extremo"
            onPress={() => router.push('/cloud')}
          />
          <BackupFileRows />
        </Card>

        <Card>
          <AppText variant="h3">Almacenamiento</AppText>
          <StorageRow />
        </Card>

        <Card>
          <AppText variant="h3">Búsqueda</AppText>
          <ReadExistingRow />
        </Card>

        <Card>
          <AppText variant="h3">Avisos</AppText>
          <SettingsRow
            icon={Bell}
            label="Avisos de vencimiento"
            detail={describeOffsets(offsets)}
            onPress={() => router.push('/reminders')}
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
