import { router } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import type { DocumentRecord } from '@/types/document';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

import { categoryInfo } from './categories';
import { DocumentThumb } from './document-thumb';
import { ExpiryBadge } from './expiry-badge';

export function openDocument(id: string) {
  router.push({ pathname: '/documents/[id]', params: { id } });
}

// Tarjeta de "Recientes": miniatura, título y ubicación del original.
export function DocumentListItem({ doc }: { doc: DocumentRecord }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={doc.title}
      onPress={() => openDocument(doc.id)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl },
        theme.shadow.card,
        pressed && styles.pressed,
      ]}
    >
      <DocumentThumb doc={doc} size={56} />
      <View style={styles.body}>
        <AppText variant="bodyMedium" numberOfLines={1}>
          {doc.title}
        </AppText>
        <View style={styles.meta}>
          {doc.physicalLocation ? (
            <MapPin color={theme.colors.textMuted} size={14} strokeWidth={2} />
          ) : null}
          <AppText variant="small" color="textMuted" numberOfLines={1} style={styles.metaText}>
            {doc.physicalLocation ?? categoryInfo[doc.category].label}
          </AppText>
        </View>
        {doc.expiresAt ? <ExpiryBadge expiresAt={doc.expiresAt} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: 4 },
  meta: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  metaText: { flex: 1 },
  pressed: { opacity: 0.7 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, padding: 12 },
});
