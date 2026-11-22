import { ScrollView, StyleSheet } from 'react-native';

import { categories, type Category } from '@/types/document';
import { Chip } from '@/ui/chip';
import { useTheme } from '@/ui/theme-provider';

import { categoryInfo } from './categories';

type Props<T extends Category | null> = {
  value: T;
  onChange: (value: T) => void;
  // Si se indica, agrega una opción para "todas las categorías" (valor null).
  allLabel?: string;
};

// Chips de colores por categoría, en fila con scroll horizontal.
export function CategoryPicker<T extends Category | null>({ value, onChange, allLabel }: Props<T>) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {allLabel ? (
        <Chip label={allLabel} selected={value === null} onPress={() => onChange(null as T)} />
      ) : null}
      {categories.map((category) => (
        <Chip
          key={category}
          label={categoryInfo[category].label}
          icon={categoryInfo[category].icon}
          tint={theme.colors.categories[category]}
          selected={value === category}
          onPress={() => onChange(category as T)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Margen para que la sombra de los chips no se recorte.
  row: { gap: 8, paddingHorizontal: 2, paddingVertical: 6 },
});
