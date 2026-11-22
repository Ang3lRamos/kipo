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
  const thumbUri = useDecryptedImage(isPdf ? null : page.thumbPath, page.id, 'thumb');
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
        {isPdf ? (
          <FileText color={theme.colors.accentText} size={32} strokeWidth={2} />
        ) : thumbUri ? (
          // Sin caché en disco: la miniatura descifrada no debe quedar copiada.
          <Image
            source={{ uri: thumbUri }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="none"
          />
        ) : null}
      </View>
      <AppText variant="caption" color="textMuted" align="center">
        {`${index + 1} · ${formatBytes(page.sizeBytes)}`}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  frame: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { height: '100%', width: '100%' },
});
