import { Search, X } from 'lucide-react-native';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from './theme-provider';

type Props = { value: string; onChangeText: (text: string) => void; placeholder: string };

// Barra de búsqueda de 52 px de alto y radio 18 (DESIGN.md).
export function SearchBar({ value, onChangeText, placeholder }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderRadius: theme.radius.lg,
          height: theme.touch.button,
        },
        theme.shadow.card,
      ]}
    >
      <Search color={colors.textMuted} size={20} strokeWidth={2} />
      <TextInput
        accessibilityLabel="Buscar documentos"
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
        returnKeyType="search"
        style={[
          styles.input,
          { color: colors.text, fontFamily: theme.font.body, fontSize: theme.size.input },
        ]}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Borrar búsqueda"
          hitSlop={12}
          onPress={() => onChangeText('')}
        >
          <X color={colors.textMuted} size={18} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  input: { flex: 1, height: '100%' },
});
