import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from './text';
import { useTheme } from './theme-provider';

type Props = { label: string; icon: LucideIcon; onPress: () => void };

// Botón flotante con ícono y texto (por ejemplo, "Escanear").
export function Fab({ label, icon: Icon, onPress }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: colors.primary,
          borderRadius: theme.radius.pill,
          height: theme.touch.fab,
        },
        theme.shadow.float,
        pressed && styles.pressed,
      ]}
    >
      <Icon color={colors.onPrimary} size={22} strokeWidth={2} />
      <AppText variant="bodyMedium" color="onPrimary" style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignItems: 'center',
    bottom: 16,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 22,
    position: 'absolute',
    right: 16,
  },
  label: { fontSize: 16 },
  pressed: { opacity: 0.85 },
});
