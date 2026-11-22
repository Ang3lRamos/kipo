import { StyleSheet, Text, View } from 'react-native';

import type { ActivityAction, ActivityEntry } from '@/types/document';
import { useTheme } from '@/ui/theme';

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
    return <Text style={{ color: theme.muted }}>Sin actividad registrada.</Text>;
  }
  return (
    <View style={styles.list}>
      {entries.map((entry) => (
        <View key={entry.id} style={styles.row}>
          <Text style={[styles.action, { color: theme.text }]}>{actionLabels[entry.action]}</Text>
          <Text style={{ color: theme.muted }}>{formatDateTime(entry.createdAt)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  action: { fontWeight: '500' },
  list: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
