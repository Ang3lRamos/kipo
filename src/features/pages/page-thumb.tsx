import { Image } from 'expo-image';
import { FileText } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatBytes } from '@/files/format-bytes';
import type { DocumentPage } from '@/types/page';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

import { useDecryptedImage } from './use-decrypted-image';

type Props = {
  page: DocumentPage;
  index: number;
  width: number;
  height: number;
  onPress: () => void;
  onLongPress: () => void;
};

// Página guardada (cifrada): se descifra en memoria para mostrarla.
export function PageThumb({ page, index, width, height, onPress, onLongPress }: Props) {
  const theme = useTheme();
  const isPdf = page.mimeType === 'application/pdf';
  // Desde la fase 6 los PDF también tienen miniatura (su primera página).
  const thumbUri = useDecryptedImage(page.thumbPath, page.id, 'thumb');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Página ${index + 1}, ${formatBytes(page.sizeBytes)}`}
      accessibilityHint="Mantén presionado para eliminarla"
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.container, { width }]}
    >
      <View
        style={[
          styles.frame,
          { height, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md },
          theme.shadow.card,
        ]}
      >
        {thumbUri ? (
          // Sin caché en disco: la miniatura descifrada no debe quedar copiada.
          <Image
            source={{ uri: thumbUri }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="none"
          />
        ) : isPdf ? (
          <FileText color={theme.colors.accentText} size={32} strokeWidth={2} />
        ) : null}
        {isPdf && thumbUri ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: theme.colors.surface, borderRadius: theme.radius.sm },
            ]}
          >
            <AppText variant="caption">PDF</AppText>
          </View>
        ) : null}
      </View>
      <AppText variant="caption" color="textMuted" align="center">
        {`${index + 1} · ${formatBytes(page.sizeBytes)}`}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: { bottom: 6, paddingHorizontal: 6, paddingVertical: 2, position: 'absolute', right: 6 },
  container: { gap: 6 },
  frame: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { height: '100%', width: '100%' },
});
