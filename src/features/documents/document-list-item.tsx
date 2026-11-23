import { router } from 'expo-router';
import { MapPin, ScanText } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import type { ListedDocument } from '@/db/documents-repo';
import { HighlightedText } from '@/ui/highlighted-text';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

import { categoryInfo } from './categories';
import { DocumentThumb } from './document-thumb';
import { ExpiryBadge } from './expiry-badge';
import { hasMatch } from './highlight';

export function openDocument(id: string) {
  router.push({ pathname: '/documents/[id]', params: { id } });
}

// Tarjeta de "Recientes" y de resultados: miniatura, título y ubicación del original.
// En una búsqueda, las coincidencias se resaltan; si están en el texto del OCR, se muestra
// el fragmento donde aparecen.
export function DocumentListItem({ doc }: { doc: ListedDocument }) {
  const theme = useTheme();
  const muted = theme.colors.textMuted;
  const hl = doc.highlight;
  const location = doc.physicalLocation ?? categoryInfo[doc.category].label;

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
        {hasMatch(hl?.title) ? (
          <HighlightedText marked={hl.title} variant="bodyMedium" numberOfLines={1} />
        ) : (
          <AppText variant="bodyMedium" numberOfLines={1}>
            {doc.title}
          </AppText>
        )}
        <View style={styles.meta}>
          {doc.physicalLocation ? <MapPin color={muted} size={14} strokeWidth={2} /> : null}
          <View style={styles.metaText}>
            {hasMatch(hl?.location) ? (
              <HighlightedText
                marked={hl.location}
                variant="small"
                color={muted}
                numberOfLines={1}
              />
            ) : (
              <AppText variant="small" color="textMuted" numberOfLines={1}>
                {location}
              </AppText>
            )}
          </View>
        </View>
        {hasMatch(hl?.ocr) ? (
          <View style={styles.meta}>
            <ScanText color={muted} size={14} strokeWidth={2} />
            <View style={styles.metaText}>
              <HighlightedText marked={hl.ocr} variant="small" color={muted} numberOfLines={2} />
            </View>
          </View>
        ) : null}
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
