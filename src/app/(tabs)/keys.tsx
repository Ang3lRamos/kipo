import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { kindInfo } from '@/features/secrets/kinds';
import { SecretListItem } from '@/features/secrets/secret-list-item';
import { useSecretList } from '@/features/secrets/use-secrets';
import { secretKinds, type SecretKind } from '@/types/secret';
import { Chip } from '@/ui/chip';
import { EmptyState } from '@/ui/empty-state';
import { Fab } from '@/ui/fab';
import { Screen } from '@/ui/screen';
import { SearchBar } from '@/ui/search-bar';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

// Claves "raras" que ningún gestor tiene: router, PIN de la alarma, códigos de recuperación…
export default function KeysScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<SecretKind | null>(null);
  const { data: secrets, loading } = useSecretList(query, kind);
  const filtering = query.trim() !== '' || kind !== null;

  const header = (
    <View style={styles.header}>
      <AppText variant="h1">Claves</AppText>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Nombre, usuario o sitio" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <Chip label="Todas" selected={kind === null} onPress={() => setKind(null)} />
        {secretKinds.map((k) => (
          <Chip
            key={k}
            label={kindInfo[k].label}
            icon={kindInfo[k].icon}
            tint={theme.colors.categories[kindInfo[k].tint]}
            selected={kind === k}
            onPress={() => setKind(k)}
          />
        ))}
      </ScrollView>
    </View>
  );

  const empty = loading ? undefined : filtering ? (
    <EmptyState mood="buscando" title="No encontré esa clave" message="Prueba con otro nombre." />
  ) : (
    <EmptyState
      mood="guino"
      title="Tus claves especiales"
      message="Guarda aquí lo que ningún gestor tiene: la clave del router, el PIN de la alarma o los códigos de recuperación."
    />
  );

  return (
    <Screen>
      <FlatList
        data={secrets}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => <SecretListItem secret={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      />
      <Fab label="Nueva clave" icon={Plus} onPress={() => router.push('/secrets/new')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 8, paddingHorizontal: 2, paddingVertical: 6 },
  header: { gap: 14, marginBottom: 4 },
  list: { gap: 10, padding: 16, paddingBottom: 96 },
});
