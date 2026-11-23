import { useFocusEffect } from 'expo-router';
import { HardDrive } from 'lucide-react-native';
import { useCallback, useState } from 'react';

import { formatBytes } from '@/files/format-bytes';
import { measureStorage, type StorageUsage } from '@/files/storage-usage';

import { SettingsRow } from './settings-row';

// Ajustes → Almacenamiento: se mide cada vez que se abre la pestaña.
export function StorageRow() {
  const [usage, setUsage] = useState<StorageUsage | null>(null);

  useFocusEffect(
    useCallback(() => {
      try {
        setUsage(measureStorage());
      } catch (error) {
        console.warn('No se pudo medir el almacenamiento', error);
      }
    }, []),
  );

  const detail = usage
    ? `Documentos y páginas: ${formatBytes(usage.files)} · Base de datos: ${formatBytes(usage.database)}`
    : 'Calculando…';
  const total = usage ? formatBytes(usage.files + usage.database) : '';
  return (
    <SettingsRow
      icon={HardDrive}
      label={`Espacio usado${total ? `: ${total}` : ''}`}
      detail={detail}
    />
  );
}
