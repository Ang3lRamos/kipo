import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Kipo } from '@/ui/kipo/kipo';
import { AppText } from '@/ui/text';
import { useTheme, useThemePreference } from '@/ui/theme-provider';
import { buildTheme, palettes } from '@/ui/themes';

import { ThemePreview } from './theme-preview';

// "Elige tu color": cada toque se aplica al momento, así toda la app es la vista previa.
export function ThemePicker({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();
  const followSystem = preference.mode === 'system';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Kipo mood="guino" size={130} />
        <AppText variant="h1" align="center">
          Elige tu color
        </AppText>
        <AppText color="textMuted" align="center">
          Kipo y la app se pintan con la paleta que elijas.
        </AppText>
      </View>

      <View style={styles.palettes}>
        {palettes.map(({ name, label }) => {
          const swatch = buildTheme(name, 'light');
          const selected = preference.palette === name;
          return (
            <Pressable
              key={name}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={label}
              onPress={() => setPreference({ palette: name, mode: preference.mode })}
              style={styles.palette}
            >
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: swatch.mascot.mid, borderColor: theme.colors.text },
                  selected && styles.swatchSelected,
                ]}
              >
                {selected ? <Check color={theme.colors.surface} size={22} strokeWidth={3} /> : null}
              </View>
              <AppText variant="label">{label}</AppText>
            </Pressable>
          );
        })}
      </View>

      <Card>
        <View style={styles.row}>
          <AppText variant="bodyMedium">Según el sistema</AppText>
          <Switch
            value={followSystem}
            onValueChange={(on) =>
              setPreference({ palette: preference.palette, mode: on ? 'system' : theme.mode })
            }
          />
        </View>
        {followSystem ? null : (
          <View style={styles.row}>
            <AppText variant="bodyMedium">Modo oscuro</AppText>
            <Switch
              value={preference.mode === 'dark'}
              onValueChange={(on) =>
                setPreference({ palette: preference.palette, mode: on ? 'dark' : 'light' })
              }
            />
          </View>
        )}
      </Card>

      <ThemePreview />
      <Button label="Listo" onPress={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 20 },
  header: { alignItems: 'center', gap: 8 },
  palette: { alignItems: 'center', gap: 6, minWidth: 64 },
  palettes: { flexDirection: 'row', justifyContent: 'space-around' },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  swatch: {
    alignItems: 'center',
    borderRadius: 26,
    borderWidth: 0,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  swatchSelected: { borderWidth: 3 },
});
