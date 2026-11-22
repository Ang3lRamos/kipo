import { ScrollView, StyleSheet } from 'react-native';

import { categories, type Category } from '@/types/document';
import { Chip } from '@/ui/chip';

import { categoryInfo } from './categories';

type Props<T extends Category | null> = {
  value: T;
  onChange: (value: T) => void;
  // Si se indica, agrega una opción para "todas las categorías" (valor null).
  allLabel?: string;
};

export function CategoryPicker<T extends Category | null>({ value, onChange, allLabel }: Props<T>) {
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
          label={`${categoryInfo[category].icon} ${categoryInfo[category].label}`}
          selected={value === category}
          onPress={() => onChange(category as T)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
});
