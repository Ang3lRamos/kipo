import { Bell, Lock, MapPin } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import type { DocumentInput } from '@/types/document';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { AppText } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { useTheme } from '@/ui/theme-provider';

import { CategoryPicker } from './category-picker';
import { validateForm, type FormErrors, type FormValues } from './form-values';

type Props = {
  initialValues: FormValues;
  submitLabel: string;
  onSubmit: (input: DocumentInput) => Promise<void>;
  header?: ReactNode; // por ejemplo, las páginas capturadas en "Nuevo documento"
};

export function DocumentForm({ initialValues, submitLabel, onSubmit, header }: Props) {
  const theme = useTheme();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormValues>(key: K) => {
    return (value: FormValues[K]) => setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const result = validateForm(values);
    if (!result.ok) return setErrors(result.errors);
    setErrors({});
    setSaving(true);
    try {
      await onSubmit(result.input);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {header}
      <TextField
        label="Título"
        placeholder="Ej. Cédula de ciudadanía"
        value={values.title}
        onChangeText={set('title')}
        error={errors.title}
      />
      <View style={styles.field}>
        <AppText variant="label">Categoría</AppText>
        <CategoryPicker value={values.category} onChange={set('category')} />
      </View>
      <View style={styles.dates}>
        <View style={styles.dateField}>
          <TextField
            label="Vence"
            placeholder="AAAA-MM-DD"
            keyboardType="numbers-and-punctuation"
            value={values.expiresAt}
            onChangeText={set('expiresAt')}
            error={errors.expiresAt}
          />
        </View>
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
      </View>
      {values.expiresAt.trim() ? (
        <Card>
          <View style={styles.alerts}>
            <Bell color={theme.colors.accentText} size={20} strokeWidth={2} />
            <AppText variant="bodyMedium" style={styles.alertsText}>
              Avisarme antes de que venza
            </AppText>
            <Switch
              accessibilityLabel="Avisarme antes de que venza"
              value={values.alertsEnabled}
              onValueChange={set('alertsEnabled')}
            />
          </View>
        </Card>
      ) : null}
      <TextField
        label="Etiquetas"
        placeholder="Ej. personal, original"
        hint="Sepáralas con comas"
        autoCapitalize="none"
        value={values.tags}
        onChangeText={set('tags')}
      />
      <Card tint={theme.colors.location.bg}>
        <View style={styles.locationTitle}>
          <MapPin color={theme.colors.location.icon} size={20} strokeWidth={2} />
          <AppText variant="h3" color={theme.colors.location.text}>
            ¿Dónde guardas el original?
          </AppText>
        </View>
        <TextField
          label="Ubicación física"
          placeholder="Ej. Carpeta azul, cajón del escritorio"
          value={values.physicalLocation}
          onChangeText={set('physicalLocation')}
        />
      </Card>
      <TextField label="Notas" multiline value={values.notes} onChangeText={set('notes')} />
      <Button
        label={submitLabel}
        icon={Lock}
        onPress={handleSubmit}
        loading={saving}
        disabled={saving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, padding: 16, paddingBottom: 48 },
  alerts: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  alertsText: { flex: 1 },
  dateField: { flex: 1 },
  dates: { flexDirection: 'row', gap: 12 },
  field: { gap: 6 },
  locationTitle: { alignItems: 'center', flexDirection: 'row', gap: 8 },
});
