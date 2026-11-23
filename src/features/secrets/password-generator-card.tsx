import { Minus, Plus, RefreshCw } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { nativePrimitives } from '@/crypto/native-primitives';
import {
  defaultGenerator,
  generatePassword,
  generatorBits,
  type GeneratorOptions,
} from '@/secrets/password-generator';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Chip } from '@/ui/chip';
import { IconButton } from '@/ui/icon-button';
import { AppText } from '@/ui/text';

const make = (options: GeneratorOptions) =>
  generatePassword((n) => nativePrimitives.randomBytes(n), options);

const toggles: { key: keyof Omit<GeneratorOptions, 'length' | 'avoidAmbiguous'>; label: string }[] =
  [
    { key: 'lowercase', label: 'abc' },
    { key: 'uppercase', label: 'ABC' },
    { key: 'digits', label: '123' },
    { key: 'symbols', label: '#$%' },
  ];

// Genera contraseñas con el CSPRNG del teléfono. "Usar" la pone en el campo.
export function PasswordGeneratorCard({ onUse }: { onUse: (password: string) => void }) {
  const [options, setOptions] = useState(defaultGenerator);
  const [password, setPassword] = useState(() => make(defaultGenerator));

  const update = (next: GeneratorOptions) => {
    // Al menos un tipo de carácter siempre activo.
    if (!toggles.some(({ key }) => next[key])) return;
    setOptions(next);
    setPassword(make(next));
  };
  const setLength = (delta: number) =>
    update({ ...options, length: Math.min(64, Math.max(6, options.length + delta)) });

  return (
    <Card>
      <AppText variant="h3" selectable style={styles.password}>
        {password}
      </AppText>
      <AppText variant="small" color="textMuted">
        {`${options.length} caracteres · ~${generatorBits(options)} bits de fuerza`}
      </AppText>
      <View style={styles.row}>
        <IconButton
          icon={Minus}
          accessibilityLabel="Más corta"
          tone="surface"
          onPress={() => setLength(-2)}
        />
        <IconButton
          icon={Plus}
          accessibilityLabel="Más larga"
          tone="surface"
          onPress={() => setLength(2)}
        />
        <IconButton
          icon={RefreshCw}
          accessibilityLabel="Generar otra"
          tone="surface"
          onPress={() => setPassword(make(options))}
        />
      </View>
      <View style={styles.chips}>
        {toggles.map(({ key, label }) => (
          <Chip
            key={key}
            label={label}
            selected={options[key]}
            onPress={() => update({ ...options, [key]: !options[key] })}
          />
        ))}
      </View>
      <Button label="Usar esta contraseña" onPress={() => onUse(password)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  password: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
  row: { flexDirection: 'row', gap: 8 },
});
