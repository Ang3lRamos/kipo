import { getDocumentAsync } from 'expo-document-picker';
import { Directory, File } from 'expo-file-system';
import { useSQLiteContext } from 'expo-sqlite';
import { FileDown, FileUp } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { backupFileName, InvalidBackupError } from '@/backup/backup-format';
import { exportBackup } from '@/backup/export-backup';
import { importBackup, readBackup, sameVault } from '@/backup/import-backup';
import { formatDate } from '@/features/documents/dates';
import { withAutoLockSuspended } from '@/features/lock/auto-lock-guard';
import { useSession } from '@/features/lock/vault-context';
import { SettingsRow } from '@/features/settings/settings-row';
import { discardTemp } from '@/files/local-store';
import { useFeedback } from '@/ui/feedback';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

import { describeExport, describeImport } from './describe';

// Ajustes → Respaldo en archivo: un .kipo cifrado que se guarda donde el usuario quiera
// (Descargas, Drive, una USB…). Solo se abre con la contraseña maestra o la de recuperación.
export function BackupFileRows() {
  const db = useSQLiteContext();
  const session = useSession();
  const theme = useTheme();
  const { confirm, toast } = useFeedback();
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  const exportNow = async () => {
    let folder: Directory;
    try {
      folder = await withAutoLockSuspended(() => Directory.pickDirectoryAsync());
    } catch {
      return; // el usuario cerró el selector
    }
    setBusy('export');
    try {
      const file = folder.createFile(backupFileName(), 'application/octet-stream');
      toast(describeExport(await exportBackup(db, session, file)));
    } catch (error) {
      console.error('No se pudo exportar el respaldo', error);
      toast('No se pudo guardar el respaldo', 'error');
    } finally {
      setBusy(null);
    }
  };

  const importNow = async () => {
    const picked = await withAutoLockSuspended(() =>
      getDocumentAsync({ type: '*/*', copyToCacheDirectory: true }),
    );
    const uri = picked.canceled ? null : (picked.assets[0]?.uri ?? null);
    if (!uri) return;
    try {
      const file = new File(uri);
      const opened = await readBackup(file);
      if (!sameVault(opened.record, session.record)) {
        toast('Ese respaldo es de otra bóveda de Kipo', 'error');
        return;
      }
      const ok = await confirm({
        title: '¿Importar este respaldo?',
        message: `Es del ${formatDate(opened.header.createdAt.slice(0, 10))}. Se agrega lo que falte; lo que tengas más nuevo no se reemplaza.`,
        confirmLabel: 'Importar',
      });
      if (!ok) return;
      setBusy('import');
      toast(describeImport(await importBackup(db, session.keys, file, opened)));
    } catch (error) {
      if (!(error instanceof InvalidBackupError)) console.error('No se pudo importar', error);
      toast(error instanceof InvalidBackupError ? error.message : 'No se pudo importar', 'error');
    } finally {
      setBusy(null);
      discardTemp(uri);
    }
  };

  return (
    <>
      <SettingsRow
        icon={FileDown}
        label="Exportar respaldo (.kipo)"
        detail="Un archivo cifrado con todo: documentos, páginas y claves"
        right={busy === 'export' ? <ActivityIndicator color={theme.colors.accentText} /> : null}
        onPress={busy ? undefined : () => void exportNow()}
      />
      <SettingsRow
        icon={FileUp}
        label="Importar respaldo"
        detail="Agrega lo que falte desde un archivo .kipo"
        right={busy === 'import' ? <ActivityIndicator color={theme.colors.accentText} /> : null}
        onPress={busy ? undefined : () => void importNow()}
      />
      <View style={styles.note}>
        <AppText variant="small" color="textMuted">
          El archivo solo se abre con tu contraseña maestra o tu clave de recuperación.
        </AppText>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  note: { paddingHorizontal: 4 },
});
