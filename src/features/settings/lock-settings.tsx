import { StyleSheet, View } from 'react-native';

import {
  backgroundOptions,
  describeBackground,
  describeIdle,
  idleOptions,
  useLockPreferences,
} from '@/features/lock/lock-preferences';
import { Card } from '@/ui/card';
import { Chip } from '@/ui/chip';
import { AppText } from '@/ui/text';

// Ajustes → Bloqueo: cuándo se cierra Kipo solo.
export function LockSettings() {
  const { preferences, update } = useLockPreferences();
  return (
    <Card>
      <AppText variant="h3">Bloqueo automático</AppText>
      <AppText variant="label">Al salir de la app</AppText>
      <View style={styles.chips}>
        {backgroundOptions.map((seconds) => (
          <Chip
            key={seconds}
            label={describeBackground(seconds)}
            selected={preferences.backgroundSeconds === seconds}
            onPress={() => update({ backgroundSeconds: seconds })}
          />
        ))}
      </View>
      <AppText variant="label">Sin tocar la pantalla</AppText>
      <View style={styles.chips}>
        {idleOptions.map((minutes) => (
          <Chip
            key={minutes}
            label={describeIdle(minutes)}
            selected={preferences.idleMinutes === minutes}
            onPress={() => update({ idleMinutes: minutes })}
          />
        ))}
      </View>
      <AppText variant="small" color="textMuted">
        Más rápido es más seguro. El escáner, la galería y el visor de PDF no cuentan como salir.
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
