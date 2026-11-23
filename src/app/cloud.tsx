import { useSQLiteContext } from 'expo-sqlite';
import { CloudUpload, LogOut, RefreshCw } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { CloudAccountSteps } from '@/features/cloud/cloud-account';
import { SyncResult } from '@/features/cloud/sync-result';
import { useCloud } from '@/features/cloud/use-cloud';
import { signOut } from '@/sync/cloud-auth';
import { countPending, loadLastSync } from '@/sync/local-sync-repo';
import { getSyncState, syncNow } from '@/sync/sync-scheduler';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { KeyboardScroll } from '@/ui/keyboard-scroll';
import { Screen, ScreenHeader } from '@/ui/screen';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';
import { useFocusedQuery } from '@/ui/use-focused-query';

function formatWhen(iso: string | null): string {
  if (!iso) return 'Nunca';
  return new Date(iso).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CloudScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const { status, sync, error, run } = useCloud();
  const loadInfo = useCallback(
    async () => ({ last: await loadLastSync(db), pending: await countPending(db) }),
    [db],
  );
  const { data: info, reload } = useFocusedQuery(loadInfo, { last: null, pending: 0 } as {
    last: string | null;
    pending: number;
  });

  const syncing = sync.kind === 'syncing';
  const [notice, setNotice] = useState<string | null>(null);

  // Cada vez que termina una sincronización (manual o automática) se releen hora y pendientes.
  useEffect(() => {
    if (sync.kind !== 'syncing') reload();
  }, [sync, reload]);

  const doSync = async () => {
    setNotice(null);
    const result = await syncNow();
    if (!result && getSyncState().kind !== 'error') {
      setNotice('No hay una sesión lista: vuelve a entrar a tu cuenta.');
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Respaldo en la nube" />
      <KeyboardScroll contentContainerStyle={styles.container}>
        <Card tint={theme.colors.location.bg}>
          <AppText variant="h3" color={theme.colors.location.text}>
            Solo sube datos cifrados
          </AppText>
          <AppText color={theme.colors.location.text}>
            Tus documentos se cifran en el teléfono antes de salir. Supabase y Cloudflare guardan
            datos que no pueden leer: sin tu contraseña maestra nadie puede abrirlos.
          </AppText>
        </Card>

        {status?.kind === 'ready' ? (
          <Card>
            <AppText variant="h3">{status.email}</AppText>
            <AppText color="textMuted">{`Última sincronización: ${formatWhen(info.last)}`}</AppText>
            <AppText color="textMuted">
              {info.pending > 0 ? `${info.pending} documentos por subir` : 'Todo está al día'}
            </AppText>
            <SyncResult sync={sync} />
            {notice ? <AppText color={theme.colors.danger.text}>{notice}</AppText> : null}
            <Button
              label={syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
              icon={syncing ? CloudUpload : RefreshCw}
              onPress={doSync}
              loading={syncing}
              disabled={syncing}
            />
            <Button
              variant="ghost"
              label="Cerrar sesión"
              icon={LogOut}
              onPress={() => void run(signOut)}
            />
          </Card>
        ) : (
          <Card>
            <AppText variant="h3">Tu cuenta</AppText>
            <CloudAccountSteps status={status} error={error} run={run} />
          </Card>
        )}
      </KeyboardScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, padding: 16, paddingBottom: 32 },
});
