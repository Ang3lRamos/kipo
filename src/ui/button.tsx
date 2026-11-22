import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './text';
import { useTheme } from './theme-provider';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  disabled,
  loading,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const palette: Record<Variant, { bg: string; fg: string }> = {
    primary: { bg: colors.primary, fg: colors.onPrimary },
    secondary: { bg: colors.surface, fg: colors.text },
    ghost: { bg: 'transparent', fg: colors.accentText },
    danger: { bg: colors.danger.bg, fg: colors.danger.text },
  };
  const { bg, fg } = palette[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderRadius: theme.radius.lg,
          minHeight: variant === 'ghost' ? theme.touch.min : theme.touch.button,
        },
        variant === 'secondary' && theme.shadow.card,
        (pressed || inactive) && styles.dimmed,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : Icon ? (
          <Icon color={fg} size={20} strokeWidth={2} />
        ) : null}
        <AppText variant="bodyMedium" color={fg} style={styles.label}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  content: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  dimmed: { opacity: 0.6 },
  label: { fontSize: 16 },
});
