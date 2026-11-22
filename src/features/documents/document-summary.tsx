import { Tag } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { DocumentRecord } from '@/types/document';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

import { categoryInfo } from './categories';
import { formatDate } from './dates';
import { ExpiryBadge } from './expiry-badge';

// Categoría, título, vencimiento y etiquetas del documento.
export function DocumentSummary({ doc }: { doc: DocumentRecord }) {
  const theme = useTheme();
  const tint = theme.colors.categories[doc.category];
  const { label, icon: Icon } = categoryInfo[doc.category];

  return (
    <View style={styles.container}>
      <View
        style={[styles.category, { backgroundColor: tint.bg, borderRadius: theme.radius.pill }]}
      >
        <Icon color={tint.text} size={14} strokeWidth={2} />
        <AppText variant="caption" color={tint.text}>
          {label}
        </AppText>
      </View>
      <AppText variant="h1">{doc.title}</AppText>
      <View style={styles.row}>
        {doc.expiresAt ? (
          <AppText color="textMuted">{`Vence el ${formatDate(doc.expiresAt)}`}</AppText>
        ) : null}
        {doc.expiresAt ? <ExpiryBadge expiresAt={doc.expiresAt} /> : null}
      </View>
      {doc.tags.length > 0 ? (
        <View style={styles.tags}>
          {doc.tags.map((tag) => (
            <View
              key={tag}
              style={[
                styles.tag,
                { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.pill },
              ]}
            >
              <Tag color={theme.colors.textMuted} size={12} strokeWidth={2} />
              <AppText variant="caption" color="textMuted">
                {tag}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  category: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  container: { gap: 8 },
  row: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
