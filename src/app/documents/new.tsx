import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { createDocument } from '@/db/documents-repo';
import { DocumentForm } from '@/features/documents/document-form';
import { emptyFormValues } from '@/features/documents/form-values';
import { withAutoLockSuspended } from '@/features/lock/auto-lock-guard';
import { useSession } from '@/features/lock/vault-context';
import { AddPageButtons } from '@/features/pages/add-page-buttons';
import { importPages } from '@/features/pages/import-pages';
import { PendingPages } from '@/features/pages/pending-pages';
import { usePendingPages } from '@/features/pages/use-pending-pages';
import { scanWithCamera } from '@/files/capture';
import { afterLocalChange } from '@/sync/after-local-change';
import { EmptyState } from '@/ui/empty-state';
import { Screen, ScreenHeader } from '@/ui/screen';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

export default function NewDocumentScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { keys } = useSession();
  const { scan } = useLocalSearchParams<{ scan?: string }>();
  const pending = usePendingPages();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const scanned = useRef(false);

  // Desde el botón "Escanear" del inicio, el escáner se abre directamente.
  useEffect(() => {
    if (scan !== '1' || scanned.current) return;
    scanned.current = true;
    withAutoLockSuspended(scanWithCamera)
      .then(pending.add)
      .catch((e: unknown) => {
        console.error('Error al usar el escáner', e);
        setError('No se pudo abrir el escáner.');
      });
  }, [scan, pending.add]);

  if (saved) {
    return (
      <Screen>
        <View style={styles.saved}>
          <EmptyState mood="guino" title="Guardado y cifrado" message="Tu documento está seguro." />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Nuevo documento" />
      <DocumentForm
        initialValues={emptyFormValues}
        submitLabel="Guardar cifrado"
        header={
          <View style={styles.pages}>
            <PendingPages items={pending.items} onRemove={pending.remove} />
            <AddPageButtons busy={false} onCaptured={pending.add} onError={setError} />
            {error ? <AppText color={theme.colors.danger.text}>{error}</AppText> : null}
          </View>
        }
        onSubmit={async (input) => {
          const id = await createDocument(db, input);
          const { failed } = await importPages(db, keys.fileKey, id, pending.commit());
          if (failed > 0) console.warn(`${failed} páginas no se pudieron guardar`);
          afterLocalChange(db);
          setSaved(true); // Kipo guiña un momento y luego se abre el documento
          setTimeout(() => router.replace({ pathname: '/documents/[id]', params: { id } }), 900);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pages: { gap: 12 },
  saved: { flex: 1, justifyContent: 'center' },
});
