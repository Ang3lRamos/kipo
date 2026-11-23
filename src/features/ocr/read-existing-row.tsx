import { useSQLiteContext } from 'expo-sqlite';
import { ScanText } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { useSession } from '@/features/lock/vault-context';
import { SettingsRow } from '@/features/settings/settings-row';
import { afterLocalChange } from '@/sync/after-local-change';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';
import { useFocusedQuery } from '@/ui/use-focused-query';

import { countUnreadPages, readExistingPages } from './read-existing';

// Ajustes → Búsqueda: leer el texto de las páginas guardadas antes del OCR.
export function ReadExistingRow() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { keys } = useSession();
  const load = useCallback(() => countUnreadPages(db), [db]);
  const { data: unread, reload } = useFocusedQuery(load, 0);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const run = async () => {
    setResult(null);
    setProgress({ done: 0, total: unread });
    const { read, failed } = await readExistingPages(db, keys, (done, total) =>
      setProgress({ done, total }),
    );
    setProgress(null);
    setResult(
      failed > 0
        ? `Listo: ${read} páginas leídas, ${failed} con error.`
        : `Listo: ${read} páginas leídas. Ya puedes buscar por su contenido.`,
    );
    reload();
    afterLocalChange(db); // sube el texto (cifrado) a la nube
  };

  const busy = progress !== null;
  const detail = busy
    ? `Leyendo ${Math.min(progress.done + 1, progress.total)} de ${progress.total}…`
    : unread > 0
      ? `${unread} páginas guardadas sin leer`
      : 'Todas las páginas ya se leyeron';

  return (
    <>
      <SettingsRow
        icon={ScanText}
        label="Leer texto de documentos guardados"
        detail={detail}
        right={busy ? <ActivityIndicator color={theme.colors.accentText} /> : undefined}
        onPress={!busy && unread > 0 ? () => void run() : undefined}
      />
      {result ? <AppText color="textMuted">{result}</AppText> : null}
    </>
  );
}
