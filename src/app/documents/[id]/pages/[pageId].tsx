import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { localFile } from '@/files/local-store';
import { ZoomableImage } from '@/features/pages/zoomable-image';
import { usePage } from '@/features/pages/use-pages';
import { Button } from '@/ui/button';
import { EmptyState } from '@/ui/empty-state';

export default function PageViewerScreen() {
  const { pageId } = useLocalSearchParams<{ id: string; pageId: string }>();
  const { data: page, loading } = usePage(pageId);

  if (loading) return null;
  if (!page) return <EmptyState title="Esta página ya no existe" />;

  const file = localFile(page.filePath);

  if (page.mimeType === 'application/pdf') {
    return (
      <EmptyState title="Documento PDF" message="Se abre con el visor del teléfono.">
        <Button
          label="Abrir PDF"
          onPress={() =>
            file
              .preview()
              .catch((error: unknown) => console.error('No se pudo abrir el PDF', error))
          }
        />
      </EmptyState>
    );
  }

  return (
    <View style={styles.screen}>
      <ZoomableImage uri={file.uri} />
      <Text style={styles.hint}>Pellizca para acercar · doble toque para alternar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { color: '#9ca3af', fontSize: 12, paddingBottom: 24, textAlign: 'center' },
  screen: { backgroundColor: '#000000', flex: 1, overflow: 'hidden' },
});
