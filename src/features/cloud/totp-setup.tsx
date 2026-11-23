import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { enrollTotp, verifyTotp, type TotpEnrollment } from '@/sync/cloud-auth';
import { Button } from '@/ui/button';
import { AppText } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { useTheme } from '@/ui/theme-provider';

type Props = { run: (action: () => Promise<void>) => Promise<boolean> };

// Supabase entrega el QR como SVG (a veces como data URI).
function svgFromQr(qr: string): string {
  const comma = qr.indexOf(',');
  if (!qr.startsWith('data:') || comma < 0) return qr;
  const body = qr.slice(comma + 1);
  return qr.slice(0, comma).includes(';base64') ? atob(body) : decodeURIComponent(body);
}

// Registrar la app de autenticación (Google Authenticator, Aegis, 1Password…).
export function TotpSetup({ run }: Props) {
  const theme = useTheme();
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void run(async () => setEnrollment(await enrollTotp()));
  }, [run]);

  if (!enrollment) return <ActivityIndicator color={theme.colors.accentText} />;

  const confirm = async () => {
    setBusy(true);
    await run(() => verifyTotp(enrollment.factorId, code));
    setBusy(false);
  };

  return (
    <View style={styles.container}>
      <AppText color="textMuted">
        Escanea este código con tu app de autenticación. Desde ahora, para entrar a la nube vas a
        necesitar tu contraseña y el código de 6 dígitos que muestre esa app.
      </AppText>
      <View
        style={[styles.qr, { backgroundColor: theme.qr.background, borderRadius: theme.radius.lg }]}
      >
        <SvgXml xml={svgFromQr(enrollment.qrSvg)} width={200} height={200} />
      </View>
      <AppText variant="small" color="textMuted">
        ¿No puedes escanearlo? Escribe esta clave en la app:
      </AppText>
      <AppText variant="bodyMedium" selectable style={styles.secret}>
        {enrollment.secret}
      </AppText>
      <TextField
        label="Código de 6 dígitos"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        textContentType="oneTimeCode"
      />
      <Button label="Activar" onPress={confirm} loading={busy} disabled={busy || code.length < 6} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  qr: { alignItems: 'center', alignSelf: 'center', padding: 12 },
  secret: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), letterSpacing: 1 },
});
