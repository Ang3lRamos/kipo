import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';

import { softDeletePage } from '@/db/pages-repo';
import { useSession } from '@/features/lock/vault-context';
import type { CapturedItem } from '@/files/capture';
import { deleteLocalFile } from '@/files/local-store';
import type { Category } from '@/types/document';
import type { DocumentPage } from '@/types/page';
import { Kipo } from '@/ui/kipo/kipo';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

import { AddPageButtons } from './add-page-buttons';
import { importPages } from './import-pages';
import { PageThumb } from './page-thumb';
import { usePages } from './use-pages';

type Props = { documentId: string; category: Category };

// Carrusel de páginas dentro de un recuadro pastel, con los botones para agregar más.
export function PagesSection({ documentId, category }: Props) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { keys } = useSession();
  const { data: pages, reload } = usePages(documentId);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCaptured = async (items: CapturedItem[]) => {
    setBusy(true);
    setMessage(null);
    try {
      const { failed } = await importPages(db, keys.fileKey, documentId, items);
      if (failed > 0) setMessage(`No se pudieron guardar ${failed} de ${items.length} páginas.`);
    } finally {
      setBusy(false);
      reload();
    }
  };

  const confirmDelete = (page: DocumentPage, index: number) => {
    Alert.alert('Eliminar página', `¿Eliminar la página ${index + 1}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await softDeletePage(db, page);
          deleteLocalFile(page.filePath);
          deleteLocalFile(page.thumbPath);
          reload();
        },
      },
    ]);
  };

  const openPage = (page: DocumentPage) =>
    router.push({
      pathname: '/documents/[id]/pages/[pageId]',
      params: { id: documentId, pageId: page.id },
    });

  return (
    <View style={styles.section}>
      <View
        style={[
          styles.preview,
          { backgroundColor: theme.colors.categories[category].bg, borderRadius: theme.radius.xxl },
        ]}
      >
        {pages.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
          >
            {pages.map((page, index) => (
              <PageThumb
                key={page.id}
                page={page}
                index={index}
                width={128}
                height={170}
                onPress={() => openPage(page)}
                onLongPress={() => confirmDelete(page, index)}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <Kipo mood="feliz" size={72} />
            <AppText color={theme.colors.categories[category].text} align="center">
              Escanea el documento o adjunta fotos o un PDF.
            </AppText>
          </View>
        )}
      </View>
      {busy ? <ActivityIndicator color={theme.colors.accentText} /> : null}
      {message ? <AppText color={theme.colors.danger.text}>{message}</AppText> : null}
      <AddPageButtons busy={busy} onCaptured={handleCaptured} onError={setMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: 8, padding: 16 },
  preview: { justifyContent: 'center', minHeight: 220, paddingVertical: 16 },
  row: { gap: 12, paddingHorizontal: 16 },
  section: { gap: 12 },
});
