import type { ReactNode } from 'react';
import Animated, { FadeIn, FadeOutLeft, LinearTransition } from 'react-native-reanimated';

// Fila de lista que entra con un fundido y sale deslizándose al borrarla; las demás se
// acomodan con suavidad (usar con Animated.FlatList e itemLayoutAnimation).
export function AnimatedRow({ children }: { children: ReactNode }) {
  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOutLeft.duration(220)}>
      {children}
    </Animated.View>
  );
}

export const listLayout = LinearTransition.springify().damping(18);
