import { StyleSheet, View } from 'react-native';

import { pickFromGallery, pickPdf, scanWithCamera, type CapturedItem } from '@/files/capture';
import { Button } from '@/ui/button';

type Props = {
  busy: boolean;
  onCaptured: (items: CapturedItem[]) => void;
  onError: (message: string) => void;
};

export function AddPageButtons({ busy, onCaptured, onError }: Props) {
  const run = (source: () => Promise<CapturedItem[]>, label: string) => async () => {
    try {
      const items = await source();
      if (items.length > 0) onCaptured(items);
    } catch (error) {
      console.error(`Error al usar ${label}`, error);
      onError(
        label === 'el escáner'
          ? 'El escáner necesita el development build; no funciona en Expo Go.'
          : `No se pudo abrir ${label}.`,
      );
    }
  };

  return (
    <View style={styles.row}>
      <View style={styles.cell}>
        <Button label="📷 Escanear" disabled={busy} onPress={run(scanWithCamera, 'el escáner')} />
      </View>
      <View style={styles.cell}>
        <Button
          label="🖼️ Galería"
          variant="secondary"
          disabled={busy}
          onPress={run(pickFromGallery, 'la galería')}
        />
      </View>
      <View style={styles.cell}>
        <Button
          label="📄 PDF"
          variant="secondary"
          disabled={busy}
          onPress={run(pickPdf, 'el selector de archivos')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1 },
  row: { flexDirection: 'row', gap: 8 },
});
