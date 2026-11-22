import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

type Props = {
  icon: LucideIcon;
  label: string;
  detail?: string;
  onPress?: () => void;
  right?: ReactNode; // por ejemplo, un interruptor
};

export function SettingsRow({ icon: Icon, label, detail, onPress, right }: Props) {
  const theme = useTheme();
  const content = (
    <>
      <View style={[styles.icon, { backgroundColor: theme.colors.surfaceAlt }]}>
        <Icon color={theme.colors.accentText} size={20} strokeWidth={2} />
      </View>
      <View style={styles.text}>
        <AppText variant="bodyMedium">{label}</AppText>
        {detail ? (
          <AppText variant="small" color="textMuted">
            {detail}
          </AppText>
        ) : null}
      </View>
      {right ?? (onPress ? <ChevronRight color={theme.colors.textMuted} size={20} /> : null)}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: { alignItems: 'center', borderRadius: 12, height: 36, justifyContent: 'center', width: 36 },
  pressed: { opacity: 0.6 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 52 },
  text: { flex: 1, gap: 2 },
});
