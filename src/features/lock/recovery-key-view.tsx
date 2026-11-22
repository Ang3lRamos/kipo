import { Platform, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/ui/theme';

// Muestra la clave de recuperación en grupos grandes para copiarla a mano en papel.
export function RecoveryKeyView({ formatted }: { formatted: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.grid}>
        {formatted.split('-').map((group, index) => (
          <Text key={index} style={[styles.group, { color: theme.text }]}>
            {group}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  group: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
