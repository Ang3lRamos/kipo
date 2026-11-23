import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { emptySecretData, validateSecret, type SecretErrors } from '@/secrets/secret-rules';
import { secretKinds, type SecretInput } from '@/types/secret';
import { Button } from '@/ui/button';
import { Chip } from '@/ui/chip';
import { KeyboardScroll } from '@/ui/keyboard-scroll';
import { AppText } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { useTheme } from '@/ui/theme-provider';

import { kindInfo } from './kinds';
import { SecretFields } from './secret-fields';

type Props = {
  initial: SecretInput;
  // En "Nueva clave" se puede elegir el tipo; al editar, no.
  canChangeKind: boolean;
  onSubmit: (input: SecretInput) => Promise<void>;
};

export function SecretForm({ initial, canChangeKind, onSubmit }: Props) {
  const theme = useTheme();
  const [input, setInput] = useState(initial);
  const [errors, setErrors] = useState<SecretErrors>({});
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const found = validateSecret(input);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      await onSubmit({ ...input, title: input.title.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardScroll contentContainerStyle={styles.container}>
      {canChangeKind ? (
        <View style={styles.kinds}>
          <AppText variant="label">Tipo</AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {secretKinds.map((kind) => (
              <Chip
                key={kind}
                label={kindInfo[kind].label}
                icon={kindInfo[kind].icon}
                tint={theme.colors.categories[kindInfo[kind].tint]}
                selected={input.data.kind === kind}
                onPress={() => setInput({ ...input, data: emptySecretData(kind) })}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
      <TextField
        label="Nombre"
        placeholder="Ej. Router de la casa"
        value={input.title}
        onChangeText={(title) => setInput({ ...input, title })}
        error={errors.title}
      />
      <SecretFields
        data={input.data}
        errors={errors}
        onChange={(data) => setInput({ ...input, data })}
      />
      <Button
        label="Guardar cifrado"
        icon={Lock}
        onPress={submit}
        loading={saving}
        disabled={saving}
      />
    </KeyboardScroll>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 8, paddingHorizontal: 2, paddingVertical: 6 },
  container: { gap: 16, padding: 16, paddingBottom: 48 },
  kinds: { gap: 6 },
});
