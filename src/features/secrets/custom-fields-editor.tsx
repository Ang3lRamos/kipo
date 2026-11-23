import { randomUUID } from 'expo-crypto';
import { Lock, LockOpen, Plus, Trash2 } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { SecretErrors } from '@/secrets/secret-rules';
import type { CustomField } from '@/types/secret';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Chip } from '@/ui/chip';
import { IconButton } from '@/ui/icon-button';
import { AppText } from '@/ui/text';
import { TextField } from '@/ui/text-field';

type Props = {
  fields: CustomField[];
  errors: SecretErrors;
  onChange: (fields: CustomField[]) => void;
};

// Atajos para los casos "raros" más comunes. `secret` define si arranca oculto.
const presets: { label: string; secret: boolean }[] = [
  { label: 'PIN', secret: true },
  { label: 'Perfil', secret: false },
  { label: 'Red wifi', secret: false },
  { label: 'Clave wifi', secret: true },
  { label: 'Pregunta de seguridad', secret: false },
  { label: 'Respuesta', secret: true },
  { label: 'Códigos de recuperación', secret: true },
];

// Campos libres para cualquier clave. El candado marca el valor como secreto: se oculta en
// pantalla y nunca entra a la búsqueda.
export function CustomFieldsEditor({ fields, errors, onChange }: Props) {
  const add = (label = '', secret = false) =>
    onChange([...fields, { id: randomUUID(), label, value: '', secret }]);
  const update = (id: string, patch: Partial<CustomField>) =>
    onChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const remove = (id: string) => onChange(fields.filter((f) => f.id !== id));

  return (
    <View style={styles.group}>
      <AppText variant="label">Campos adicionales</AppText>
      {fields.map((field) => (
        <Card key={field.id}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <TextField
                label="Nombre del campo"
                placeholder="Ej. PIN del perfil"
                value={field.label}
                onChangeText={(label) => update(field.id, { label })}
                error={errors[`field:${field.id}`]}
              />
            </View>
            <IconButton
              icon={field.secret ? Lock : LockOpen}
              accessibilityLabel={field.secret ? 'Marcado como secreto' : 'Marcar como secreto'}
              onPress={() => update(field.id, { secret: !field.secret })}
            />
            <IconButton
              icon={Trash2}
              accessibilityLabel="Quitar campo"
              onPress={() => remove(field.id)}
            />
          </View>
          <TextField
            label={field.secret ? 'Valor (secreto)' : 'Valor'}
            value={field.value}
            onChangeText={(value) => update(field.id, { value })}
            secureTextEntry={field.secret}
            autoCapitalize="none"
            autoCorrect={false}
            multiline={!field.secret}
          />
        </Card>
      ))}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {presets.map((preset) => (
          <Chip
            key={preset.label}
            label={`+ ${preset.label}`}
            selected={false}
            onPress={() => add(preset.label, preset.secret)}
          />
        ))}
      </ScrollView>
      <Button label="Agregar campo" variant="ghost" icon={Plus} onPress={() => add()} />
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 8, paddingHorizontal: 2, paddingVertical: 6 },
  flex: { flex: 1 },
  group: { gap: 10 },
  row: { alignItems: 'flex-end', flexDirection: 'row', gap: 4 },
});
