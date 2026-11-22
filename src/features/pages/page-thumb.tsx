import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatBytes } from '@/files/format-bytes';
import { localFile } from '@/files/local-store';
import type { DocumentPage } from '@/types/page';
import { useTheme } from '@/ui/theme';

type Props = {
  page: DocumentPage;
  index: number;
  onPress: () => void;
  onLongPress: () => void;
};

export function PageThumb({ page, index, onPress, onLongPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Página ${index + 1}`}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.container}
    >
      <View
        style={[styles.frame, { backgroundColor: theme.background, borderColor: theme.border }]}
      >
        {page.thumbPath ? (
          <Image
            source={{ uri: localFile(page.thumbPath).uri }}
            style={styles.image}
            contentFit="cover"
            // Sin caché en disco: en la fase 3 las miniaturas descifradas no deben quedar copiadas.
            cachePolicy="memory"
          />
        ) : (
          <Text style={styles.pdf}>PDF</Text>
        )}
      </View>
      <Text style={[styles.caption, { color: theme.muted }]}>
        {`${index + 1} · ${formatBytes(page.sizeBytes)}`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  caption: { fontSize: 12, textAlign: 'center' },
  container: { gap: 4, width: 96 },
  frame: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    height: 128,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { height: '100%', width: '100%' },
  pdf: { fontSize: 18, fontWeight: '700' },
});
