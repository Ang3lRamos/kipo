import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from './theme-provider';

type Props = {
  icon: LucideIcon;
  // Obligatorio: los botones que solo tienen ícono necesitan un nombre para el lector de pantalla.
  accessibilityLabel: string;
  onPress: () => void;
  tone?: 'plain' | 'surface';
  color?: string;
};

export function IconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  tone = 'plain',
  color,
}: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.button,
        { width: theme.touch.min, height: theme.touch.min, borderRadius: theme.radius.pill },
        tone === 'surface' && [{ backgroundColor: theme.colors.surface }, theme.shadow.card],
        pressed && styles.pressed,
      ]}
    >
      <Icon color={color ?? theme.colors.text} size={22} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
});
