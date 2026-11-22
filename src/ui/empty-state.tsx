import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from './theme';

type Props = { title: string; message?: string; children?: ReactNode };

export function EmptyState({ title, message, children }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: theme.muted }]}>{message}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12, padding: 32 },
  message: { fontSize: 15, textAlign: 'center' },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
});
