import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { suspendAutoLock } from '@/features/lock/auto-lock-guard';
import { useSession } from '@/features/lock/vault-context';
import { useDecryptedImage } from '@/features/pages/use-decrypted-image';
import { usePage } from '@/features/pages/use-pages';
import { ZoomableImage } from '@/features/pages/zoomable-image';
import { decryptPdfToTemp } from '@/files/encrypted-store';
import { Button } from '@/ui/button';
import { EmptyState } from '@/ui/empty-state';

export default function PageViewerScreen() {
  const { pageId } = useLocalSearchParams<{ id: string; pageId: string }>();
  const { keys } = useSession();
  const { data: page, loading } = usePage(pageId);
  const isPdf = page?.mimeType === 'application/pdf';
  const imageUri = useDecryptedImage(isPdf ? null : (page?.filePath ?? null), pageId, 'page');
  const [opening, setOpening] = useState(false);

  if (loading) return null;
  if (!page) return <EmptyState title="Esta página ya no existe" />;

  if (isPdf) {
    const openPdf = async () => {
      setOpening(true);
      try {
        // El PDF descifrado va a la caché temporal, que se borra al bloquear Kipo.
        const file = await decryptPdfToTemp(keys.fileKey, page.filePath, page.id);
        suspendAutoLock(); // el visor es otra app; se reanuda al volver a Kipo
        await file.preview();
      } catch (error) {
        console.error('No se pudo abrir el PDF', error);
      } finally {
        setOpening(false);
      }
    };
    return (
      <EmptyState title="Documento PDF" message="Se abre con el visor del teléfono.">
        <Button label={opening ? 'Abriendo…' : 'Abrir PDF'} onPress={openPdf} disabled={opening} />
      </EmptyState>
    );
  }

  return (
    <View style={styles.screen}>
      {imageUri ? <ZoomableImage uri={imageUri} /> : <ActivityIndicator style={styles.loader} />}
      <Text style={styles.hint}>Pellizca para acercar · doble toque para alternar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { color: '#9ca3af', fontSize: 12, paddingBottom: 24, textAlign: 'center' },
  loader: { flex: 1 },
  screen: { backgroundColor: '#000000', flex: 1, overflow: 'hidden' },
});
