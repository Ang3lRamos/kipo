import { useLocalSearchParams } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { suspendAutoLock } from '@/features/lock/auto-lock-guard';
import { useSession } from '@/features/lock/vault-context';
import { useDecryptedImage } from '@/features/pages/use-decrypted-image';
import { usePage } from '@/features/pages/use-pages';
import { ZoomableImage } from '@/features/pages/zoomable-image';
import { decryptPdfToTemp } from '@/files/encrypted-store';
import { Button } from '@/ui/button';
import { EmptyState } from '@/ui/empty-state';
import { Screen, ScreenHeader } from '@/ui/screen';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

export default function PageViewerScreen() {
  const { pageId } = useLocalSearchParams<{ id: string; pageId: string }>();
  const theme = useTheme();
  const { keys } = useSession();
  const { data: page, loading } = usePage(pageId);
  const isPdf = page?.mimeType === 'application/pdf';
  const imageUri = useDecryptedImage(isPdf ? null : (page?.filePath ?? null), pageId, 'page');
  const [opening, setOpening] = useState(false);

  if (loading) return null;
  if (!page) return <EmptyState mood="buscando" title="Esta página ya no existe" />;

  if (isPdf) {
    const openPdf = async () => {
      setOpening(true);
      try {
        // El PDF descifrado va a la caché temporal, que se borra al bloquear Kipo.
        const file = await decryptPdfToTemp(keys.fileKey, page.filePath, page.id);
        suspendAutoLock(); // el visor es otra app; se reanuda al volver a Kipo
        try {
          await file.preview();
        } catch {
          // Si el sistema aún no ve el archivo recién escrito, se reintenta una vez.
          await new Promise((resolve) => setTimeout(resolve, 300));
          await file.preview();
        }
      } catch (error) {
        console.error('No se pudo abrir el PDF', error);
      } finally {
        setOpening(false);
      }
    };
    return (
      <Screen>
        <ScreenHeader title="PDF" />
        <View style={styles.pdf}>
          <FileText color={theme.colors.accentText} size={56} strokeWidth={1.6} />
          <AppText color="textMuted" align="center">
            Se abre con el visor de PDF del teléfono.
          </AppText>
          <Button label="Abrir PDF" onPress={openPdf} loading={opening} disabled={opening} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen background={theme.viewer.background}>
      <ScreenHeader title="Página" />
      <View style={styles.viewer}>
        {imageUri ? (
          <ZoomableImage uri={imageUri} />
        ) : (
          <ActivityIndicator style={styles.loader} color={theme.viewer.hint} />
        )}
      </View>
      <AppText variant="small" color={theme.viewer.hint} align="center" style={styles.hint}>
        Pellizca para acercar · doble toque para alternar
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { paddingBottom: 24 },
  loader: { flex: 1 },
  pdf: { alignItems: 'center', flex: 1, gap: 16, justifyContent: 'center', padding: 24 },
  viewer: { flex: 1, overflow: 'hidden' },
});
