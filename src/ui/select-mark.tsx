import { Check } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme } from './theme-provider';

// Círculo de selección que aparece en las filas mientras se eligen varias.
export function SelectMark({ selected }: { selected: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.mark,
        {
          borderColor: selected ? theme.colors.onPrimary : theme.colors.border,
          backgroundColor: selected ? theme.colors.primary : 'transparent',
        },
      ]}
    >
      {selected ? <Check color={theme.colors.onPrimary} size={16} strokeWidth={3} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 2,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
});
