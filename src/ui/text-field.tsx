import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from './theme';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | undefined;
  hint?: string;
};

export function TextField({ label, error, hint, multiline, ...inputProps }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        {...inputProps}
        multiline={multiline ?? false}
        placeholderTextColor={theme.muted}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : theme.border,
            color: theme.text,
          },
        ]}
      />
      {error ? (
        <Text style={[styles.helper, { color: theme.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.helper, { color: theme.muted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  helper: { fontSize: 13 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: { fontSize: 14, fontWeight: '600' },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
});
