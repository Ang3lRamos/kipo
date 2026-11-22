import { Link } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { CategoryPicker } from '@/features/documents/category-picker';
import { DocumentListItem } from '@/features/documents/document-list-item';
import { insertSampleDocuments } from '@/features/documents/sample-documents';
import { useDocumentList } from '@/features/documents/use-documents';
import type { Category } from '@/types/document';
import { Button } from '@/ui/button';
import { EmptyState } from '@/ui/empty-state';
import { useTheme } from '@/ui/theme';

export default function HomeScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const { data: docs, loading, reload } = useDocumentList({ query, category });
  const filtering = query.trim() !== '' || category !== null;

  const loadSamples = async () => {
    await insertSampleDocuments(db);
    reload();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TextInput
          placeholder="Buscar por nombre, etiqueta o ubicación"
          placeholderTextColor={theme.muted}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
          autoCorrect={false}
          style={[
            styles.search,
            { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
          ]}
        />
        <CategoryPicker value={category} onChange={setCategory} allLabel="Todas" />
        <Link href="/expiring" asChild>
          <Pressable>
            <Text style={[styles.link, { color: theme.primary }]}>
              ⏰ Ver documentos por vencer
            </Text>
          </Pressable>
        </Link>
      </View>

      <FlatList
        data={docs}
        keyExtractor={(doc) => doc.id}
        renderItem={({ item }) => <DocumentListItem doc={item} />}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          loading ? undefined : filtering ? (
            <EmptyState title="Sin resultados" message="Prueba con otra palabra o categoría." />
          ) : (
            <EmptyState
              title="Aún no tienes documentos"
              message="Agrega el primero con el botón +."
            >
              {__DEV__ ? (
                <Button
                  label="Cargar 10 documentos de prueba"
                  variant="secondary"
                  onPress={loadSamples}
                />
              ) : null}
            </EmptyState>
          )
        }
      />

      <Link href="/documents/new" asChild>
        <Pressable
          accessibilityLabel="Nuevo documento"
          style={[styles.fab, { backgroundColor: theme.primary }]}
        >
          <Text style={[styles.fabText, { color: theme.primaryText }]}>+</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignItems: 'center',
    borderRadius: 28,
    bottom: 32,
    elevation: 4,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 24,
    width: 56,
  },
  fabText: { fontSize: 30, lineHeight: 34 },
  header: { gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  link: { fontSize: 15, fontWeight: '600', paddingVertical: 4 },
  list: { gap: 10, padding: 16, paddingBottom: 120 },
  screen: { flex: 1 },
  search: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
