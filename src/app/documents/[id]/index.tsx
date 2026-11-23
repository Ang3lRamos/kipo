import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ellipsis, Pencil } from 'lucide-react-native';
import { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import { logActivity } from '@/db/activity-repo';
import { softDeleteDocument } from '@/db/documents-repo';
import { ActivityList } from '@/features/documents/activity-list';
import { formatDate } from '@/features/documents/dates';
import { DocumentSummary } from '@/features/documents/document-summary';
import { LocationCard } from '@/features/documents/location-card';
import { useDocumentDetail } from '@/features/documents/use-documents';
import { PagesSection } from '@/features/pages/pages-section';
import { deleteDocumentFiles } from '@/files/local-store';
import { syncReminders } from '@/notifications/sync-reminders';
import { Button } from '@/ui/button';
import { InfoRow, Section } from '@/ui/card';
import { EmptyState } from '@/ui/empty-state';
import { IconButton } from '@/ui/icon-button';
import { Screen, ScreenHeader } from '@/ui/screen';

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { data, loading } = useDocumentDetail(id);

  // Registra la vista una sola vez al abrir el documento.
  useEffect(() => {
    logActivity(db, id, 'visto').catch((error: unknown) =>
      console.error('No se pudo registrar la vista', error),
    );
  }, [db, id]);

  const doc = data.doc;
  const edit = () => router.push({ pathname: '/documents/[id]/edit', params: { id } });

  const confirmDelete = () => {
    if (!doc) return;
    Alert.alert('Eliminar documento', `¿Eliminar "${doc.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await softDeleteDocument(db, doc.id);
          // La fila queda para la sincronización; los archivos locales se borran ya.
          deleteDocumentFiles(doc.id);
          void syncReminders(db); // cancela sus avisos
          router.back();
        },
      },
    ]);
  };

  const openMenu = () =>
    Alert.alert('Opciones', undefined, [
      { text: 'Editar', onPress: edit },
      { text: 'Eliminar', style: 'destructive', onPress: confirmDelete },
      { text: 'Cancelar', style: 'cancel' },
    ]);

  return (
    <Screen>
      <ScreenHeader
        right={
          doc ? (
            <IconButton
              icon={Ellipsis}
              accessibilityLabel="Opciones"
              tone="surface"
              onPress={openMenu}
            />
          ) : null
        }
      />
      {loading ? null : !doc ? (
        <EmptyState mood="buscando" title="Este documento ya no existe" />
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <PagesSection documentId={doc.id} category={doc.category} />
          <DocumentSummary doc={doc} />
          <LocationCard location={doc.physicalLocation} />
          {doc.issuedAt || doc.notes ? (
            <Section title="Datos">
              <InfoRow label="Expedición" value={doc.issuedAt ? formatDate(doc.issuedAt) : null} />
              <InfoRow label="Notas" value={doc.notes} />
            </Section>
          ) : null}
          <Section title="Historial">
            <ActivityList entries={data.activity} />
          </Section>
          <Button label="Editar" icon={Pencil} onPress={edit} />
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, padding: 16, paddingBottom: 48 },
});
