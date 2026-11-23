import { ActivityIndicator } from 'react-native';

import type { CloudStatus } from '@/sync/cloud-auth';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

import { AccountForm } from './account-form';
import { TotpCode } from './totp-code';
import { TotpSetup } from './totp-setup';

type Props = {
  status: CloudStatus | null;
  error: string | null;
  run: (action: () => Promise<void>) => Promise<boolean>;
};

// Pasos para dejar la cuenta lista: sesión → segundo factor. Se usa en "Respaldo en la nube"
// y al restaurar en un teléfono nuevo.
export function CloudAccountSteps({ status, error, run }: Props) {
  const theme = useTheme();
  const errorText = error ? <AppText color={theme.colors.danger.text}>{error}</AppText> : null;

  if (!status) return <ActivityIndicator color={theme.colors.accentText} />;
  if (status.kind === 'not-configured') {
    return (
      <AppText color="textMuted">
        Falta configurar Supabase: crea el archivo .env con EXPO_PUBLIC_SUPABASE_URL y
        EXPO_PUBLIC_SUPABASE_ANON_KEY y reinicia Expo.
      </AppText>
    );
  }
  if (status.kind === 'signed-out') {
    return (
      <>
        <AccountForm run={run} />
        {errorText}
      </>
    );
  }
  if (status.kind === 'needs-enroll') {
    return (
      <>
        <TotpSetup run={run} />
        {errorText}
      </>
    );
  }
  if (status.kind === 'needs-code') {
    return (
      <>
        <TotpCode factorId={status.factorId} run={run} />
        {errorText}
      </>
    );
  }
  return errorText;
}
