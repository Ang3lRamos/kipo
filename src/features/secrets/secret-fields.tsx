import { StyleSheet, View } from 'react-native';

import type { SecretErrors } from '@/secrets/secret-rules';
import { subscriptionPeriods, type SecretData } from '@/types/secret';
import { Chip } from '@/ui/chip';
import { DateField, MoneyField } from '@/ui/formatted-fields';
import { AppText } from '@/ui/text';
import { TextField } from '@/ui/text-field';

import { CustomFieldsEditor } from './custom-fields-editor';
import { PasswordInput } from './password-input';

type Props = { data: SecretData; errors: SecretErrors; onChange: (data: SecretData) => void };

const noAuto = { autoCapitalize: 'none', autoCorrect: false } as const;

// Campos según el tipo de clave, más los campos adicionales (en todos los tipos).
export function SecretFields({ data, errors, onChange }: Props) {
  const field = <D extends SecretData>(d: D, key: keyof D & string) => ({
    value: String(d[key] ?? ''),
    onChangeText: (value: string) => onChange({ ...d, [key]: value }),
    error: errors[key],
  });
  const extra = (
    <CustomFieldsEditor
      fields={data.fields}
      errors={errors}
      onChange={(fields) => onChange({ ...data, fields })}
    />
  );

  if (data.kind === 'login') {
    return (
      <View style={styles.group}>
        <TextField label="Usuario o correo" {...noAuto} {...field(data, 'username')} />
        <PasswordInput
          value={data.password}
          onChange={(password) => onChange({ ...data, password })}
        />
        <TextField
          label="Sitio o app"
          placeholder="Ej. netflix.com o 192.168.1.1"
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
        {extra}
      </View>
    );
  }
  if (data.kind === 'note') {
    return (
      <View style={styles.group}>
        <TextField label="Contenido" multiline {...field(data, 'body')} />
        {extra}
      </View>
    );
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
        {extra}
      </View>
    );
  }
  return (
    <View style={styles.group}>
      <TextField label="Servicio" placeholder="Ej. Netflix" {...field(data, 'service')} />
      <TextField
        label="Correo o usuario"
        keyboardType="email-address"
        {...noAuto}
        {...field(data, 'account')}
      />
      <PasswordInput
        value={data.password}
        onChange={(password) => onChange({ ...data, password })}
      />
      <TextField label="Perfil" placeholder="Ej. Angel" {...field(data, 'profile')} />
      <MoneyField
        label="Valor"
        value={data.amount}
        onChange={(amount) => onChange({ ...data, amount })}
        error={errors.amount}
      />
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
      <DateField
        label="Próxima renovación"
        value={data.renewsAt}
        onChange={(renewsAt) => onChange({ ...data, renewsAt })}
        error={errors.renewsAt}
        hint={
          data.period === 'otro'
            ? 'Kipo te avisa 3 días antes y el mismo día.'
            : `Kipo te avisa 3 días antes y el mismo día de cada renovación ${data.period}.`
        }
      />
      <TextField label="Notas" multiline {...field(data, 'notes')} />
      {extra}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  group: { gap: 14 },
});
