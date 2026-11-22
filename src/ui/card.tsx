import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from './text';
import { useTheme } from './theme-provider';

type Props = { children: ReactNode; style?: ViewStyle | ViewStyle[]; tint?: string };

// Tarjeta blanca (o del color `tint`) con sombra suave y sin bordes.
export function Card({ children, style, tint }: Props) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: tint ?? theme.colors.surface, borderRadius: theme.radius.xl },
        !tint && theme.shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <AppText variant="h3">{title}</AppText>
      {children}
    </Card>
  );
}

export function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <AppText variant="small" color="textMuted">
        {label}
      </AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12, padding: 16 },
  row: { gap: 2 },
});
