import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from './text';
import { useTheme } from './theme-provider';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | undefined;
  hint?: string;
};

export function TextField({ label, error, hint, multiline, ...inputProps }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        multiline={multiline ?? false}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger.text : colors.border,
            borderRadius: theme.radius.md,
            color: colors.text,
            fontFamily: theme.font.body,
            fontSize: theme.size.input, // 16 px: evita el zoom automático de iOS
            minHeight: multiline ? 96 : theme.touch.button,
          },
          multiline && styles.multiline,
        ]}
      />
      {error ? (
        <AppText variant="small" color={colors.danger.text}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="small" color="textMuted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  input: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  multiline: { textAlignVertical: 'top' },
});
