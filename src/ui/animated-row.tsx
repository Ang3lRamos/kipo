import type { ReactNode } from 'react';
import Animated, { Easing, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

// Fila de lista: aparece y desaparece con un fundido corto; las demás se acomodan sin rebote
// (usar con Animated.FlatList e itemLayoutAnimation).
export function AnimatedRow({ children }: { children: ReactNode }) {
  return (
    <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)}>
      {children}
    </Animated.View>
  );
}

export const listLayout = LinearTransition.duration(200).easing(Easing.out(Easing.quad));
