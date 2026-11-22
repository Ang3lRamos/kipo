import { StyleSheet, View } from 'react-native';

import type { ActivityAction, ActivityEntry } from '@/types/document';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

const actionLabels: Record<ActivityAction, string> = {
  creado: 'Creado',
  editado: 'Editado',
  visto: 'Visto',
  compartido: 'Compartido',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ActivityList({ entries }: { entries: ActivityEntry[] }) {
  const theme = useTheme();
  if (entries.length === 0) {
    return <AppText color="textMuted">Sin actividad registrada.</AppText>;
  }
  return (
    <View style={styles.list}>
      {entries.slice(0, 8).map((entry) => (
        <View key={entry.id} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: theme.colors.accentText }]} />
          <AppText variant="bodyMedium" style={styles.action}>
            {actionLabels[entry.action]}
          </AppText>
          <AppText variant="small" color="textMuted">
            {formatDateTime(entry.createdAt)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  action: { flex: 1 },
  dot: { borderRadius: 4, height: 8, width: 8 },
  list: { gap: 10 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 10 },
});
