import { IdCard, MapPin } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

// Muestra cómo se ve una tarjeta de documento con el tema actual. Datos ficticios.
export function ThemePreview() {
  const theme = useTheme();
  const { colors } = theme;
  const tint = colors.categories.identidad;
  return (
    <View
      style={[styles.frame, { backgroundColor: colors.background, borderRadius: theme.radius.xxl }]}
    >
      <AppText variant="caption" color="textMuted">
        Vista previa
      </AppText>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderRadius: theme.radius.xl },
          theme.shadow.card,
        ]}
      >
        <View style={[styles.thumb, { backgroundColor: tint.bg, borderRadius: theme.radius.md }]}>
          <IdCard color={tint.text} size={24} strokeWidth={2} />
        </View>
        <View style={styles.body}>
          <AppText variant="bodyMedium">Cédula de ciudadanía</AppText>
          <View style={styles.meta}>
            <MapPin color={colors.textMuted} size={14} strokeWidth={2} />
            <AppText variant="small" color="textMuted">
              Carpeta azul
            </AppText>
          </View>
        </View>
      </View>
      <View
        style={[styles.button, { backgroundColor: colors.primary, borderRadius: theme.radius.lg }]}
      >
        <AppText variant="bodyMedium" color="onPrimary">
          Escanear
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: 2 },
  button: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  card: { alignItems: 'center', flexDirection: 'row', gap: 12, padding: 12 },
  frame: { gap: 10, padding: 16 },
  meta: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  thumb: { alignItems: 'center', height: 48, justifyContent: 'center', width: 48 },
});
