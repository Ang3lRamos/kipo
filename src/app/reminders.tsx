import { useSQLiteContext } from 'expo-sqlite';
import { BellRing } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { scheduleTestReminder } from '@/notifications/notifier';
import { describeOffsets, reminderOptions } from '@/notifications/reminder-plan';
import { loadReminderOffsets, saveReminderOffsets } from '@/notifications/sync-reminders';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Chip } from '@/ui/chip';
import { Screen, ScreenHeader } from '@/ui/screen';
import { AppText } from '@/ui/text';
import { useFocusedQuery } from '@/ui/use-focused-query';

function optionLabel(offset: number): string {
  if (offset === 0) return 'El mismo día';
  return offset === 1 ? '1 día' : `${offset} días`;
}

export default function RemindersScreen() {
  const db = useSQLiteContext();
  const load = useCallback(() => loadReminderOffsets(db), [db]);
  const { data: offsets, reload } = useFocusedQuery(load, [] as number[]);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const toggle = async (offset: number) => {
    const next = offsets.includes(offset)
      ? offsets.filter((o) => o !== offset)
      : [...offsets, offset].sort((a, b) => b - a);
    await saveReminderOffsets(db, next); // guarda y reprograma todos los avisos
    reload();
  };

  const test = async () => {
    const ok = await scheduleTestReminder();
    setTestMessage(
      ok ? 'Listo: el aviso llega en unos 2 minutos.' : 'Kipo no tiene permiso para notificar.',
    );
  };

  return (
    <Screen>
      <ScreenHeader title="Avisos de vencimiento" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <AppText variant="h3">¿Cuándo te aviso?</AppText>
          <AppText color="textMuted">
            {`Ahora: ${describeOffsets(offsets)}. Los avisos llegan a las 9:00 a. m.`}
          </AppText>
          <View style={styles.chips}>
            {reminderOptions.map((offset) => (
              <Chip
                key={offset}
                label={optionLabel(offset)}
                selected={offsets.includes(offset)}
                onPress={() => void toggle(offset)}
              />
            ))}
          </View>
        </Card>
        <Card>
          <AppText variant="h3">Privacidad</AppText>
          <AppText color="textMuted">
            Los avisos nunca dicen qué documento vence, porque se ven con el teléfono bloqueado.
            Puedes apagarlos para un documento desde su formulario.
          </AppText>
        </Card>
        {__DEV__ ? (
          <Card>
            <AppText variant="h3">Prueba (solo en desarrollo)</AppText>
            <Button
              label="Probar aviso en 2 minutos"
              icon={BellRing}
              variant="secondary"
              onPress={test}
            />
            {testMessage ? <AppText color="textMuted">{testMessage}</AppText> : null}
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  container: { gap: 16, padding: 16, paddingBottom: 32 },
});
