import { Clock } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';
import type { Theme } from '@/ui/themes';

import { daysUntil, describeExpiry, todayIso } from './dates';

// Ventana en la que un documento se considera "por vencer".
export const expiringWindowDays = 60;
const urgentDays = 7;

export function isUrgent(expiresAt: string): boolean {
  return daysUntil(expiresAt, todayIso()) <= urgentDays;
}

// Durazno si vence en 7 días o menos (o ya venció); mantequilla si vence más adelante.
export function expiryTone(theme: Theme, expiresAt: string) {
  return isUrgent(expiresAt) ? theme.colors.warning : theme.colors.caution;
}

export function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const theme = useTheme();
  const today = todayIso();
  const days = daysUntil(expiresAt, today);
  if (Number.isNaN(days) || days > expiringWindowDays) return null;
  const tone = expiryTone(theme, expiresAt);

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg, borderRadius: theme.radius.pill }]}>
      <Clock color={tone.text} size={12} strokeWidth={2} />
      <AppText variant="caption" color={tone.text}>
        {describeExpiry(expiresAt, today)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});
