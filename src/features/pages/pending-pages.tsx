import { Image } from 'expo-image';
import { FileText, X } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { CapturedItem } from '@/files/capture';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

type Props = { items: CapturedItem[]; onRemove: (index: number) => void };

// Páginas capturadas que todavía no se guardan (archivos temporales en la caché).
// Al guardar se comprimen, se cifran y se borran los temporales.
export function PendingPages({ items, onRemove }: Props) {
  const theme = useTheme();
  if (items.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map((item, index) => (
        <View
          key={item.uri}
          style={[
            styles.tile,
            { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md },
            theme.shadow.card,
          ]}
        >
          {item.kind === 'pdf' ? (
            <FileText color={theme.colors.accentText} size={28} strokeWidth={2} />
          ) : (
            <Image
              source={{ uri: item.uri }}
              style={styles.image}
              contentFit="cover"
              cachePolicy="none"
            />
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Quitar la página ${index + 1}`}
            hitSlop={10}
            onPress={() => onRemove(index)}
            style={[styles.remove, { backgroundColor: theme.colors.surface }]}
          >
            <X color={theme.colors.text} size={14} strokeWidth={2.5} />
          </Pressable>
          <AppText variant="caption" style={styles.number}>
            {String(index + 1)}
          </AppText>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  image: { height: '100%', width: '100%' },
  number: { bottom: 4, left: 8, position: 'absolute' },
  remove: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
    top: 4,
    width: 24,
  },
  row: { gap: 10, paddingVertical: 4 },
  tile: {
    alignItems: 'center',
    height: 120,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 90,
  },
});
