import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { logActivity } from '@/db/activity-repo';
import { softDeleteDocument } from '@/db/documents-repo';
import { ActivityList } from '@/features/documents/activity-list';
import { categoryInfo } from '@/features/documents/categories';
import { formatDate } from '@/features/documents/dates';
import { ExpiryBadge } from '@/features/documents/expiry-badge';
import { useDocumentDetail } from '@/features/documents/use-documents';
import { PagesSection } from '@/features/pages/pages-section';
import { deleteDocumentFiles } from '@/files/local-store';
import { Button } from '@/ui/button';
import { EmptyState } from '@/ui/empty-state';
import { InfoRow, Section } from '@/ui/section';
import { useTheme } from '@/ui/theme';

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const { data, loading } = useDocumentDetail(id);

  // Registra la vista una sola vez al abrir el documento.
  useEffect(() => {
    logActivity(db, id, 'visto').catch((error: unknown) =>
      console.error('No se pudo registrar la vista', error),
    );
  }, [db, id]);

  if (loading) return null;
  const doc = data.doc;
  if (!doc) return <EmptyState title="Este documento ya no existe" />;

  const info = categoryInfo[doc.category];

  const confirmDelete = () => {
    Alert.alert('Eliminar documento', `¿Eliminar "${doc.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await softDeleteDocument(db, doc.id);
          // La fila queda para la sincronización; los archivos locales se borran ya.
          deleteDocumentFiles(doc.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{doc.title}</Text>
        <Text style={{ color: theme.muted }}>{`${info.icon} ${info.label}`}</Text>
        {doc.expiresAt ? <ExpiryBadge expiresAt={doc.expiresAt} /> : null}
      </View>

      <PagesSection documentId={doc.id} />

      <Section title="Original físico">
        <Text style={[styles.location, { color: theme.text }]}>
          {doc.physicalLocation ?? 'No indicaste dónde está el original.'}
        </Text>
      </Section>

      <Section title="Datos">
        <InfoRow label="Expedición" value={doc.issuedAt ? formatDate(doc.issuedAt) : null} />
        <InfoRow label="Vencimiento" value={doc.expiresAt ? formatDate(doc.expiresAt) : null} />
        <InfoRow label="Etiquetas" value={doc.tags.length > 0 ? doc.tags.join(', ') : null} />
        <InfoRow label="Notas" value={doc.notes} />
      </Section>

      <Section title="Historial">
        <ActivityList entries={data.activity} />
      </Section>

      <Button
        label="Editar"
        onPress={() => router.push({ pathname: '/documents/[id]/edit', params: { id: doc.id } })}
      />
      <Button label="Eliminar" variant="danger" onPress={confirmDelete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, padding: 16, paddingBottom: 48 },
  header: { gap: 6 },
  location: { fontSize: 17 },
  title: { fontSize: 24, fontWeight: '700' },
});
