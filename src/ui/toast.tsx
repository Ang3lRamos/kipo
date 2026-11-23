import { CircleAlert, CircleCheck } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './text';
import { useTheme } from './theme-provider';

export type ToastMessage = { id: number; text: string; tone: 'ok' | 'error' };

// Aviso corto abajo de la pantalla ("3 documentos eliminados").
export function Toast({ message }: { message: ToastMessage | null }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  if (!message) return null;
  const error = message.tone === 'error';
  const fg = error ? theme.colors.danger.text : theme.colors.onPrimary;
  const Icon = error ? CircleAlert : CircleCheck;
  return (
    <Animated.View
      key={message.id}
      entering={FadeInDown.duration(180)}
      exiting={FadeOutDown.duration(150)}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        {
          bottom: insets.bottom + 96,
          backgroundColor: error ? theme.colors.danger.bg : theme.colors.primary,
          borderRadius: theme.radius.pill,
        },
        theme.shadow.float,
      ]}
    >
      <Icon color={fg} size={18} strokeWidth={2.2} />
      <AppText variant="bodyMedium" color={fg}>
        {message.text}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    position: 'absolute',
  },
});
