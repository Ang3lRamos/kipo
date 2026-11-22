import { FlatList, StyleSheet } from 'react-native';

import { DocumentListItem } from '@/features/documents/document-list-item';
import { expiringWindowDays } from '@/features/documents/expiry-badge';
import { useExpiringDocuments } from '@/features/documents/use-documents';
import { EmptyState } from '@/ui/empty-state';

export default function ExpiringScreen() {
  const { data: docs, loading } = useExpiringDocuments();

  return (
    <FlatList
      data={docs}
      keyExtractor={(doc) => doc.id}
      renderItem={({ item }) => <DocumentListItem doc={item} />}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        loading ? undefined : (
          <EmptyState
            title="Nada por vencer"
            message={`Ningún documento vence en los próximos ${expiringWindowDays} días.`}
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { gap: 10, padding: 16 },
});
