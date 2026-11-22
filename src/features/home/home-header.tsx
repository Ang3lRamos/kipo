import { Lock } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { CategoryPicker } from '@/features/documents/category-picker';
import { useVault } from '@/features/lock/vault-context';
import type { Category } from '@/types/document';
import { IconButton } from '@/ui/icon-button';
import { Kipo } from '@/ui/kipo/kipo';
import { Logo } from '@/ui/screen';
import { SearchBar } from '@/ui/search-bar';
import { AppText } from '@/ui/text';

type Props = {
  query: string;
  onQueryChange: (query: string) => void;
  category: Category | null;
  onCategoryChange: (category: Category | null) => void;
};

export function HomeHeader({ query, onQueryChange, category, onCategoryChange }: Props) {
  const { lock } = useVault();
  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Logo />
        <IconButton
          icon={Lock}
          accessibilityLabel="Bloquear Kipo"
          tone="surface"
          onPress={() => lock()}
        />
      </View>
      <View style={styles.greeting}>
        <Kipo mood="feliz" size={64} />
        <AppText variant="h2" style={styles.greetingText}>
          ¿Qué buscamos hoy?
        </AppText>
      </View>
      <SearchBar
        value={query}
        onChangeText={onQueryChange}
        placeholder="Nombre, etiqueta o ubicación"
      />
      <CategoryPicker value={category} onChange={onCategoryChange} allLabel="Todas" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  greeting: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  greetingText: { flex: 1 },
  top: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
});
