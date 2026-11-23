import { Eye, EyeOff, WandSparkles } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/ui/button';
import { IconButton } from '@/ui/icon-button';
import { TextField } from '@/ui/text-field';

import { PasswordGeneratorCard } from './password-generator-card';

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
};

// Contraseña con botón para verla y generador. Se usa en inicios de sesión y suscripciones.
export function PasswordInput({ label = 'Contraseña', value, onChange, error }: Props) {
  const [visible, setVisible] = useState(false);
  const [generating, setGenerating] = useState(false);
  return (
    <View style={styles.group}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField
            label={label}
            value={value}
            onChangeText={onChange}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoCorrect={false}
            error={error}
          />
        </View>
        <IconButton
          icon={visible ? EyeOff : Eye}
          accessibilityLabel={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
          tone="surface"
          onPress={() => setVisible((v) => !v)}
        />
      </View>
      {generating ? (
        <PasswordGeneratorCard
          onUse={(password) => {
            onChange(password);
            setGenerating(false);
            setVisible(true);
          }}
        />
      ) : (
        <Button
          label="Generar contraseña"
          variant="ghost"
          icon={WandSparkles}
          onPress={() => setGenerating(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  group: { gap: 4 },
  row: { alignItems: 'flex-end', flexDirection: 'row', gap: 8 },
});
