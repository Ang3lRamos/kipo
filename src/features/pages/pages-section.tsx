import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text } from 'react-native';

import { softDeletePage } from '@/db/pages-repo';
import type { CapturedItem } from '@/files/capture';
import { formatBytes } from '@/files/format-bytes';
import { deleteLocalFile } from '@/files/local-store';
import type { DocumentPage } from '@/types/page';
import { Section } from '@/ui/section';
import { useTheme } from '@/ui/theme';

import { AddPageButtons } from './add-page-buttons';
import { importPages } from './import-pages';
import { PageThumb } from './page-thumb';
import { usePages } from './use-pages';

export function PagesSection({ documentId }: { documentId: string }) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { data: pages, reload } = usePages(documentId);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const totalBytes = pages.reduce((sum, page) => sum + page.sizeBytes, 0);

  const handleCaptured = async (items: CapturedItem[]) => {
    setBusy(true);
    setMessage(null);
    try {
      const { failed } = await importPages(db, documentId, items);
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

  return (
    <Section title={pages.length > 0 ? `Páginas · ${formatBytes(totalBytes)}` : 'Páginas'}>
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
              onPress={() =>
                router.push({
                  pathname: '/documents/[id]/pages/[pageId]',
                  params: { id: documentId, pageId: page.id },
                })
              }
              onLongPress={() => confirmDelete(page, index)}
            />
          ))}
        </ScrollView>
      ) : (
        <Text style={{ color: theme.muted }}>Escanea el documento o adjunta fotos o un PDF.</Text>
      )}
      {busy ? <ActivityIndicator /> : null}
      {message ? <Text style={{ color: theme.danger }}>{message}</Text> : null}
      <AddPageButtons busy={busy} onCaptured={handleCaptured} onError={setMessage} />
      {pages.length > 0 ? (
        <Text style={[styles.hint, { color: theme.muted }]}>
          Mantén presionada una página para eliminarla.
        </Text>
      ) : null}
    </Section>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 12 },
  row: { gap: 10 },
});
