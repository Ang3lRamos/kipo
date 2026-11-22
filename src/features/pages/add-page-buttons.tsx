import { Camera, FileText, Images, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { withAutoLockSuspended } from '@/features/lock/auto-lock-guard';
import { pickFromGallery, pickPdf, scanWithCamera, type CapturedItem } from '@/files/capture';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

type Props = {
  busy: boolean;
  onCaptured: (items: CapturedItem[]) => void;
  onError: (message: string) => void;
};

type Source = { label: string; icon: LucideIcon; run: () => Promise<CapturedItem[]>; what: string };

const sources: Source[] = [
  { label: 'Escanear', icon: Camera, run: scanWithCamera, what: 'el escáner' },
  { label: 'Galería', icon: Images, run: pickFromGallery, what: 'la galería' },
  { label: 'PDF', icon: FileText, run: pickPdf, what: 'el selector de archivos' },
];

export function AddPageButtons({ busy, onCaptured, onError }: Props) {
  const theme = useTheme();

  const run = (source: Source) => async () => {
    try {
      // El escáner y los selectores son pantallas del sistema: no bloquear mientras se usan.
      const items = await withAutoLockSuspended(source.run);
      if (items.length > 0) onCaptured(items);
    } catch (error) {
      console.error(`Error al usar ${source.what}`, error);
      onError(`No se pudo abrir ${source.what}.`);
    }
  };

  return (
    <View style={styles.row}>
      {sources.map((source) => {
        const Icon = source.icon;
        return (
          <Pressable
            key={source.label}
            accessibilityRole="button"
            accessibilityLabel={`Agregar desde ${source.label.toLowerCase()}`}
            disabled={busy}
            onPress={run(source)}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg },
              theme.shadow.card,
              (pressed || busy) && styles.dimmed,
            ]}
          >
            <Icon color={theme.colors.accentText} size={22} strokeWidth={2} />
            <AppText variant="label">{source.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', flex: 1, gap: 4, minHeight: 64, justifyContent: 'center' },
  dimmed: { opacity: 0.5 },
  row: { flexDirection: 'row', gap: 10 },
});
