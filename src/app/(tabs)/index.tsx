import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ScanLine } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { DocumentListItem } from '@/features/documents/document-list-item';
import { useListDeletion } from '@/features/lists/use-list-deletion';
import { insertSampleDocuments } from '@/features/documents/sample-documents';
import { useDocumentList } from '@/features/documents/use-documents';
import { ExpiringSummary } from '@/features/home/expiring-summary';
import { HomeHeader } from '@/features/home/home-header';
import type { Category } from '@/types/document';
import { Button } from '@/ui/button';
import { EmptyState } from '@/ui/empty-state';
import { Fab } from '@/ui/fab';
import { Screen } from '@/ui/screen';
import { SelectionBar } from '@/ui/selection-bar';
import { AnimatedRow, listLayout } from '@/ui/animated-row';
import { AppText } from '@/ui/text';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const { data, loading, reload } = useDocumentList({ query, category });
  const { selection, visible: docs, deleteSelected } = useListDeletion('documents', data, reload);
  const filtering = query.trim() !== '' || category !== null;

  const loadSamples = async () => {
    await insertSampleDocuments(db);
    reload();
  };

  const header = selection.active ? (
    <View style={styles.header}>
      <SelectionBar
        selection={selection}
        allIds={docs.map((d) => d.id)}
        onDelete={() => void deleteSelected()}
      />
    </View>
  ) : (
    <View style={styles.header}>
      <HomeHeader
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
      />
      {filtering ? null : <ExpiringSummary />}
      {docs.length > 0 ? (
        <AppText variant="h3">{filtering ? 'Resultados' : 'Recientes'}</AppText>
      ) : null}
    </View>
  );

  const empty = loading ? undefined : filtering ? (
    <EmptyState
      mood="buscando"
      title="No encontré nada"
      message="Prueba con otra palabra o categoría."
    />
  ) : (
    <EmptyState
      title="Aún no tienes documentos"
      message="Escanea el primero con el botón de abajo."
    >
      {__DEV__ ? (
        <Button label="Cargar 10 documentos de prueba" variant="secondary" onPress={loadSamples} />
      ) : null}
    </EmptyState>
  );

  return (
    <Screen>
      <Animated.FlatList
        data={docs}
        keyExtractor={(doc) => doc.id}
        renderItem={({ item }) => (
          <AnimatedRow>
            <DocumentListItem
              doc={item}
              selecting={selection.active}
              selected={selection.ids.has(item.id)}
              onToggle={selection.toggle}
            />
          </AnimatedRow>
        )}
        itemLayoutAnimation={listLayout}
        extraData={selection.ids}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      />
      {selection.active ? null : (
        <Fab
          label="Escanear"
          icon={ScanLine}
          onPress={() => router.push({ pathname: '/documents/new', params: { scan: '1' } })}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 20, marginBottom: 4 },
  list: { gap: 10, padding: 16, paddingBottom: 96 },
});
