import { Eye, EyeOff, WandSparkles } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { SecretErrors } from '@/secrets/secret-rules';
import { subscriptionPeriods, type SecretData } from '@/types/secret';
import { Button } from '@/ui/button';
import { Chip } from '@/ui/chip';
import { IconButton } from '@/ui/icon-button';
import { AppText } from '@/ui/text';
import { TextField } from '@/ui/text-field';

import { PasswordGeneratorCard } from './password-generator-card';

type Props = { data: SecretData; errors: SecretErrors; onChange: (data: SecretData) => void };

const noAuto = { autoCapitalize: 'none', autoCorrect: false } as const;

// Campos según el tipo de clave.
export function SecretFields({ data, errors, onChange }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [generating, setGenerating] = useState(false);
  const field = <D extends SecretData>(d: D, key: keyof D & string) => ({
    value: String(d[key] ?? ''),
    onChangeText: (value: string) => onChange({ ...d, [key]: value }),
    error: errors[key],
  });

  if (data.kind === 'login') {
    return (
      <View style={styles.group}>
        <TextField label="Usuario o correo" {...noAuto} {...field(data, 'username')} />
        <View style={styles.passwordRow}>
          <View style={styles.flex}>
            <TextField
              label="Contraseña"
              secureTextEntry={!showPassword}
              {...noAuto}
              {...field(data, 'password')}
            />
          </View>
          <IconButton
            icon={showPassword ? EyeOff : Eye}
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            tone="surface"
            onPress={() => setShowPassword((v) => !v)}
          />
        </View>
        {generating ? (
          <PasswordGeneratorCard
            onUse={(password) => {
              onChange({ ...data, password });
              setGenerating(false);
              setShowPassword(true);
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
        <TextField
          label="Sitio o app"
          placeholder="Ej. 192.168.1.1"
          {...noAuto}
          {...field(data, 'url')}
        />
        <TextField
          label="Clave de dos pasos (opcional)"
          hint="La clave en texto o el enlace otpauth:// que da el sitio al activar 2FA."
          {...noAuto}
          {...field(data, 'totp')}
        />
        <TextField label="Notas" multiline {...field(data, 'notes')} />
      </View>
    );
  }
  if (data.kind === 'note') {
    return <TextField label="Contenido" multiline {...field(data, 'body')} />;
  }
  if (data.kind === 'card') {
    return (
      <View style={styles.group}>
        <TextField label="Banco" {...field(data, 'bank')} />
        <TextField
          label="Últimos 4 dígitos"
          hint="Nunca guardes el número completo ni el código de seguridad."
          keyboardType="number-pad"
          maxLength={4}
          {...field(data, 'last4')}
        />
        <TextField label="Titular" {...field(data, 'holder')} />
        <TextField label="Notas" multiline {...field(data, 'notes')} />
      </View>
    );
  }
  return (
    <View style={styles.group}>
      <TextField label="Servicio" placeholder="Ej. Netflix" {...field(data, 'service')} />
      <TextField label="Cuenta o correo" {...noAuto} {...field(data, 'account')} />
      <TextField label="Valor" placeholder="Ej. $38.900" {...field(data, 'amount')} />
      <AppText variant="label">Se cobra</AppText>
      <View style={styles.chips}>
        {subscriptionPeriods.map((period) => (
          <Chip
            key={period}
            label={period}
            selected={data.period === period}
            onPress={() => onChange({ ...data, period })}
          />
        ))}
      </View>
      <TextField label="Próxima renovación" placeholder="AAAA-MM-DD" {...field(data, 'renewsAt')} />
      <TextField label="Notas" multiline {...field(data, 'notes')} />
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flex: { flex: 1 },
  group: { gap: 14 },
  passwordRow: { alignItems: 'flex-end', flexDirection: 'row', gap: 8 },
});
