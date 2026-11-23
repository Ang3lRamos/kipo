import { CircleAlert, CircleCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { SyncState } from '@/sync/sync-scheduler';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
}

// Resultado de la última sincronización (manual o automática), con el motivo de cada fallo.
export function SyncResult({ sync }: { sync: SyncState }) {
  const theme = useTheme();
  const { colors } = theme;

  if (sync.kind === 'syncing' || (sync.kind === 'idle' && !sync.last)) return null;

  const failed = sync.kind === 'error' || (sync.last?.failed ?? 0) > 0;
  const tone = failed
    ? colors.danger
    : { bg: colors.categories.identidad.bg, text: colors.categories.identidad.text };
  const Icon = failed ? CircleAlert : CircleCheck;

  let title: string;
  let lines: string[] = [];
  if (sync.kind === 'error') {
    title = `No se pudo sincronizar (${time(sync.at)})`;
    lines = [sync.message];
  } else {
    const {
      downloaded,
      uploaded,
      failed: count,
      errors,
    } = sync.last ?? {
      downloaded: 0,
      uploaded: 0,
      failed: 0,
      errors: [],
    };
    const moved =
      downloaded + uploaded === 0
        ? 'ya estaba todo al día'
        : `${plural(uploaded, 'subido', 'subidos')} y ${plural(downloaded, 'bajado', 'bajados')}`;
    title =
      count > 0
        ? `${plural(count, 'documento no se pudo', 'documentos no se pudieron')} sincronizar`
        : `Sincronizado a las ${sync.at ? time(sync.at) : ''}: ${moved}`;
    lines = errors.slice(0, 3);
  }

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.box, { backgroundColor: tone.bg, borderRadius: theme.radius.md }]}
    >
      <View style={styles.title}>
        <Icon color={tone.text} size={18} strokeWidth={2} />
        <AppText variant="bodyMedium" color={tone.text} style={styles.flex}>
          {title}
        </AppText>
      </View>
      {lines.map((line, index) => (
        <AppText key={index} variant="small" color={tone.text}>
          {line}
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 6, padding: 12 },
  flex: { flex: 1 },
  title: { alignItems: 'center', flexDirection: 'row', gap: 8 },
});
