import { FlatList, StyleSheet, View } from 'react-native';

import { DocumentListItem } from '@/features/documents/document-list-item';
import { expiringWindowDays } from '@/features/documents/expiry-badge';
import { useExpiringDocuments } from '@/features/documents/use-documents';
import { EmptyState } from '@/ui/empty-state';
import { Screen } from '@/ui/screen';
import { AppText } from '@/ui/text';

export default function ExpiringScreen() {
  const { data: docs, loading } = useExpiringDocuments();

  return (
    <Screen>
      <FlatList
        data={docs}
        keyExtractor={(doc) => doc.id}
        renderItem={({ item }) => <DocumentListItem doc={item} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="h1">Por vencer</AppText>
            <AppText color="textMuted">
              {`Lo que vence en los próximos ${expiringWindowDays} días y lo que ya venció.`}
            </AppText>
          </View>
        }
        ListEmptyComponent={
          loading ? undefined : (
            <EmptyState
              title="Nada por vencer"
              message={`Ningún documento vence en los próximos ${expiringWindowDays} días.`}
            />
          )
        }
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6, marginBottom: 8 },
  list: { gap: 10, padding: 16 },
});
