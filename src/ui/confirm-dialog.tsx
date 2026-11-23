import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { Button } from './button';
import { Kipo } from './kipo/kipo';
import type { KipoMood } from './kipo/kipo-types';
import { AppText } from './text';
import { useTheme } from './theme-provider';

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel: string;
  destructive?: boolean;
  mood?: KipoMood;
};

type Props = { options: ConfirmOptions | null; onAnswer: (ok: boolean) => void };

// Diálogo de confirmación con el estilo de Kipo (reemplaza al Alert del sistema).
export function ConfirmDialog({ options, onAnswer }: Props) {
  const theme = useTheme();
  return (
    <Modal
      visible={options !== null}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => onAnswer(false)}
    >
      {options ? (
        <Animated.View
          entering={FadeIn.duration(150)}
          style={[styles.scrim, { backgroundColor: theme.colors.scrim }]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityLabel="Cancelar"
            onPress={() => onAnswer(false)}
          />
          <Animated.View
            entering={ZoomIn.springify().damping(18)}
            accessibilityViewIsModal
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface, borderRadius: theme.radius.xxl },
              theme.shadow.float,
            ]}
          >
            <Kipo mood={options.mood ?? 'buscando'} size={72} />
            <AppText variant="h2" style={styles.center}>
              {options.title}
            </AppText>
            {options.message ? (
              <AppText color="textMuted" style={styles.center}>
                {options.message}
              </AppText>
            ) : null}
            <View style={styles.actions}>
              <Button
                label={options.confirmLabel}
                variant={options.destructive ? 'danger' : 'primary'}
                onPress={() => onAnswer(true)}
              />
              <Button label="Cancelar" variant="ghost" onPress={() => onAnswer(false)} />
            </View>
          </Animated.View>
        </Animated.View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: { alignSelf: 'stretch', gap: 8, marginTop: 8 },
  card: { alignItems: 'center', gap: 10, maxWidth: 380, padding: 24, width: '100%' },
  center: { textAlign: 'center' },
  scrim: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
});
