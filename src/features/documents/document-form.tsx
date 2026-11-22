import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { DocumentInput } from '@/types/document';
import { Button } from '@/ui/button';
import { TextField } from '@/ui/text-field';
import { useTheme } from '@/ui/theme';

import { CategoryPicker } from './category-picker';
import { validateForm, type FormErrors, type FormValues } from './form-values';

type Props = {
  initialValues: FormValues;
  submitLabel: string;
  onSubmit: (input: DocumentInput) => Promise<void>;
};

export function DocumentForm({ initialValues, submitLabel, onSubmit }: Props) {
  const theme = useTheme();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormValues>(key: K) => {
    return (value: FormValues[K]) => setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const result = validateForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await onSubmit(result.input);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: theme.background }}
    >
      <TextField
        label="Nombre"
        placeholder="Ej. Cédula de ciudadanía"
        value={values.title}
        onChangeText={set('title')}
        error={errors.title}
      />
      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.text }]}>Categoría</Text>
        <CategoryPicker value={values.category} onChange={set('category')} />
      </View>
      <TextField
        label="¿Dónde está el original?"
        placeholder="Ej. Carpeta azul, cajón del escritorio"
        value={values.physicalLocation}
        onChangeText={set('physicalLocation')}
      />
      <TextField
        label="Etiquetas"
        placeholder="Ej. personal, original"
        hint="Sepáralas con comas"
        autoCapitalize="none"
        value={values.tags}
        onChangeText={set('tags')}
      />
      <View style={styles.dates}>
        <View style={styles.dateField}>
          <TextField
            label="Expedición"
            placeholder="AAAA-MM-DD"
            keyboardType="numbers-and-punctuation"
            value={values.issuedAt}
            onChangeText={set('issuedAt')}
            error={errors.issuedAt}
          />
        </View>
        <View style={styles.dateField}>
          <TextField
            label="Vencimiento"
            placeholder="AAAA-MM-DD"
            keyboardType="numbers-and-punctuation"
            value={values.expiresAt}
            onChangeText={set('expiresAt')}
            error={errors.expiresAt}
          />
        </View>
      </View>
      <TextField label="Notas" multiline value={values.notes} onChangeText={set('notes')} />
      <Button
        label={saving ? 'Guardando…' : submitLabel}
        onPress={handleSubmit}
        disabled={saving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, padding: 16, paddingBottom: 48 },
  dateField: { flex: 1 },
  dates: { flexDirection: 'row', gap: 12 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600' },
});
