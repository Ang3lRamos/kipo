import { Copy } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { copySecret } from '@/secrets/clipboard';
import { parseTotp, secondsLeft, totpCode } from '@/secrets/totp';
import { IconButton } from '@/ui/icon-button';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

// Código de dos pasos que cambia cada 30 s, con barra de tiempo restante.
export function TotpView({ secret }: { secret: string }) {
  const theme = useTheme();
  const config = useMemo(() => {
    try {
      return parseTotp(secret);
    } catch {
      return null;
    }
  }, [secret]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!config) {
    return <AppText color={theme.colors.danger.text}>La clave de dos pasos no es válida.</AppText>;
  }
  const code = totpCode(config, now);
  const left = secondsLeft(config, now);
  const pretty = code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <AppText variant="small" color="textMuted">
          Código de dos pasos
        </AppText>
        <AppText variant="h2" style={styles.code} accessibilityLabel={code.split('').join(' ')}>
          {pretty}
        </AppText>
        <View style={[styles.track, { backgroundColor: theme.colors.surfaceAlt }]}>
          <View
            style={[
              styles.bar,
              {
                width: `${(left / config.period) * 100}%`,
                backgroundColor: left <= 5 ? theme.colors.warning.text : theme.colors.accentText,
              },
            ]}
          />
        </View>
        <AppText variant="caption" color="textMuted">{`Cambia en ${left} s`}</AppText>
      </View>
      <IconButton
        icon={Copy}
        accessibilityLabel="Copiar código"
        onPress={() => void copySecret(code)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderRadius: 2, height: 4 },
  code: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), letterSpacing: 2 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  text: { flex: 1, gap: 4 },
  track: { borderRadius: 2, height: 4, overflow: 'hidden' },
});
