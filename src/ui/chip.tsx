import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from './text';
import { useTheme } from './theme-provider';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  // Colores pastel de la categoría; si no se dan, se usa el color principal del tema.
  tint?: { bg: string; text: string };
  icon?: LucideIcon;
};

export function Chip({ label, selected, onPress, tint, icon: Icon }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const active = tint ?? { bg: colors.primary, text: colors.onPrimary };
  const fg = selected ? active.text : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      style={[
        styles.chip,
        { backgroundColor: selected ? active.bg : colors.surface, borderRadius: theme.radius.pill },
        !selected && theme.shadow.card,
      ]}
    >
      {Icon ? <Icon color={fg} size={16} strokeWidth={2} /> : null}
      <AppText variant="label" color={fg}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
  },
});
