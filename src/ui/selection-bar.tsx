import { CheckCheck, Trash2, X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button } from './button';
import { IconButton } from './icon-button';
import { AppText } from './text';
import { useTheme } from './theme-provider';
import type { Selection } from './use-selection';

type Props = { selection: Selection; allIds: string[]; onDelete: () => void };

// Barra que reemplaza el encabezado mientras hay elementos marcados.
export function SelectionBar({ selection, allIds, onDelete }: Props) {
  const theme = useTheme();
  const count = selection.ids.size;
  const allSelected = count === allIds.length;
  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl },
        theme.shadow.card,
      ]}
    >
      <IconButton icon={X} accessibilityLabel="Cancelar selección" onPress={selection.clear} />
      <AppText variant="bodyMedium" style={styles.count}>
        {count === 1 ? '1 seleccionado' : `${count} seleccionados`}
      </AppText>
      {allSelected ? null : (
        <IconButton
          icon={CheckCheck}
          accessibilityLabel="Seleccionar todos"
          onPress={() => selection.setAll(allIds)}
        />
      )}
      <Button label="Eliminar" variant="danger" icon={Trash2} onPress={onDelete} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { alignItems: 'center', flexDirection: 'row', gap: 4, padding: 8 },
  count: { flex: 1 },
});
