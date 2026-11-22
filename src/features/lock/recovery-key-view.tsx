import { Platform, StyleSheet, View } from 'react-native';

import { Card } from '@/ui/card';
import { AppText } from '@/ui/text';

// Muestra la clave de recuperación en grupos grandes para copiarla a mano en papel.
export function RecoveryKeyView({ formatted }: { formatted: string }) {
  return (
    <Card>
      <View style={styles.grid}>
        {formatted.split('-').map((group, index) => (
          <AppText key={index} variant="h2" style={styles.group}>
            {group}
          </AppText>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' },
  // Monoespaciada para distinguir 0/O y 1/I al copiarla.
  group: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), letterSpacing: 2 },
});
