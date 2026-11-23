import { Check, Copy, Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { clearAfterMs, copySecret } from '@/secrets/clipboard';
import { IconButton } from '@/ui/icon-button';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

type Props = { label: string; value: string; secret?: boolean; monospace?: boolean };

// Un dato de la clave: oculto si es secreto (contraseña), con botones para ver y copiar.
export function SecretValueRow({ label, value, secret = false, monospace = false }: Props) {
  const theme = useTheme();
  const [visible, setVisible] = useState(!secret);
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  const copy = async () => {
    await copySecret(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <AppText variant="small" color="textMuted">
          {label}
        </AppText>
        <AppText
          variant="bodyMedium"
          selectable={visible}
          style={(monospace || secret) && styles.mono}
        >
          {visible ? value : '•'.repeat(Math.min(value.length, 16))}
        </AppText>
        {copied ? (
          <AppText variant="caption" color={theme.colors.accentText}>
            {`Copiado. Se borra del portapapeles en ${clearAfterMs / 1000} s.`}
          </AppText>
        ) : null}
      </View>
      {secret ? (
        <IconButton
          icon={visible ? EyeOff : Eye}
          accessibilityLabel={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
          onPress={() => setVisible((v) => !v)}
        />
      ) : null}
      <IconButton
        icon={copied ? Check : Copy}
        accessibilityLabel={`Copiar ${label}`}
        onPress={copy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mono: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
  row: { alignItems: 'center', flexDirection: 'row', gap: 4, minHeight: 52 },
  text: { flex: 1, gap: 2 },
});
