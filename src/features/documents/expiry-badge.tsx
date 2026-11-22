import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/ui/theme';

import { daysUntil, describeExpiry, todayIso } from './dates';

// Ventana en la que un documento se considera "por vencer".
export const expiringWindowDays = 60;

export function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const theme = useTheme();
  const today = todayIso();
  const days = daysUntil(expiresAt, today);
  if (Number.isNaN(days) || days > expiringWindowDays) return null;

  const expired = days < 0;
  return (
    <View style={[styles.badge, { backgroundColor: expired ? theme.dangerBg : theme.warningBg }]}>
      <Text style={[styles.text, { color: expired ? theme.danger : theme.warning }]}>
        {describeExpiry(expiresAt, today)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  text: { fontSize: 12, fontWeight: '600' },
});
