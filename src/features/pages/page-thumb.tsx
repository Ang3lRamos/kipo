import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatBytes } from '@/files/format-bytes';
import type { DocumentPage } from '@/types/page';
import { useTheme } from '@/ui/theme';

import { useDecryptedImage } from './use-decrypted-image';

type Props = {
  page: DocumentPage;
  index: number;
  onPress: () => void;
  onLongPress: () => void;
};

export function PageThumb({ page, index, onPress, onLongPress }: Props) {
  const theme = useTheme();
  const thumbUri = useDecryptedImage(page.thumbPath, page.id, 'thumb');
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
        {page.mimeType === 'application/pdf' ? (
          <Text style={styles.pdf}>PDF</Text>
        ) : thumbUri ? (
          <Image
            source={{ uri: thumbUri }}
            style={styles.image}
            contentFit="cover"
            // Sin caché en disco: la miniatura descifrada no debe quedar copiada.
            cachePolicy="none"
          />
        ) : null}
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
