import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/ui/button';
import { TextField } from '@/ui/text-field';
import { useTheme } from '@/ui/theme';

import { minAcceptableScore, rateMasterPassword } from './password-strength';

type Props = {
  submitLabel: string;
  busy: boolean;
  onSubmit: (password: string) => void;
};

// Contraseña nueva + confirmación + medidor. La contraseña solo vive en el estado de este
// formulario y se entrega una vez; nunca se guarda ni se registra.
export function NewPasswordForm({ submitLabel, busy, onSubmit }: Props) {
  const theme = useTheme();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | undefined>();
  const strength = rateMasterPassword(password);
  const colors = [theme.danger, theme.danger, theme.warning, theme.primary, theme.primary];

  const submit = () => {
    if (strength.score < minAcceptableScore) return setError(strength.hint);
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    setError(undefined);
    onSubmit(password);
  };

  return (
    <View style={styles.form}>
      <TextField
        label="Contraseña maestra"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
      />
      {password.length > 0 ? (
        <View style={styles.meter}>
          <View style={styles.bars}>
            {[1, 2, 3, 4].map((level) => (
              <View
                key={level}
                style={[
                  styles.bar,
                  {
                    backgroundColor:
                      strength.score >= level ? colors[strength.score] : theme.border,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={{ color: theme.muted }}>{`${strength.label}. ${strength.hint}`}</Text>
        </View>
      ) : null}
      <TextField
        label="Repite la contraseña"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        error={error}
      />
      <Button label={busy ? 'Protegiendo…' : submitLabel} onPress={submit} disabled={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderRadius: 2, flex: 1, height: 4 },
  bars: { flexDirection: 'row', gap: 4 },
  form: { gap: 14 },
  meter: { gap: 6 },
});
