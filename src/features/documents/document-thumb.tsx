import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useDecryptedImage } from '@/features/pages/use-decrypted-image';
import { pageIdFromThumbPath } from '@/files/storage-paths';
import type { DocumentRecord } from '@/types/document';
import { useTheme } from '@/ui/theme-provider';

import { categoryInfo } from './categories';

// Miniatura de portada descifrada; si no hay páginas, el ícono sobre el color de la categoría.
export function DocumentThumb({ doc, size }: { doc: DocumentRecord; size: number }) {
  const theme = useTheme();
  const tint = theme.colors.categories[doc.category];
  const Icon = categoryInfo[doc.category].icon;
  const coverPageId = doc.thumbPath ? pageIdFromThumbPath(doc.thumbPath) : null;
  const uri = useDecryptedImage(doc.thumbPath, coverPageId, 'thumb');

  return (
    <View
      style={[
        styles.thumb,
        { width: size, height: size, backgroundColor: tint.bg, borderRadius: theme.radius.md },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.image} contentFit="cover" cachePolicy="none" />
      ) : (
        <Icon color={tint.text} size={size * 0.42} strokeWidth={2} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { height: '100%', width: '100%' },
  thumb: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
