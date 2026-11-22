import { Pressable, StyleSheet } from 'react-native';

import type { DocumentRecord } from '@/types/document';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

import { daysUntil, describeExpiry, formatDate, todayIso } from './dates';
import { openDocument } from './document-list-item';
import { expiryTone } from './expiry-badge';

// Tarjeta de "Por vencer" en el inicio: durazno si es urgente, mantequilla si no.
export function ExpiringCard({ doc }: { doc: DocumentRecord }) {
  const theme = useTheme();
  if (!doc.expiresAt) return null;
  const tone = expiryTone(theme, doc.expiresAt);
  const days = daysUntil(doc.expiresAt, todayIso());

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${doc.title}, ${describeExpiry(doc.expiresAt, todayIso())}`}
      onPress={() => openDocument(doc.id)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: tone.bg, borderRadius: theme.radius.xl },
        pressed && styles.pressed,
      ]}
    >
      <AppText variant="display" color={tone.text}>
        {days < 0 ? '!' : String(days)}
      </AppText>
      <AppText variant="caption" color={tone.text}>
        {days < 0 ? 'vencido' : days === 1 ? 'día' : 'días'}
      </AppText>
      <AppText variant="bodyMedium" color={tone.text} numberOfLines={2} style={styles.title}>
        {doc.title}
      </AppText>
      <AppText variant="caption" color={tone.text}>
        {formatDate(doc.expiresAt)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: 2, minHeight: 140, padding: 16 },
  pressed: { opacity: 0.75 },
  title: { marginTop: 8 },
});
