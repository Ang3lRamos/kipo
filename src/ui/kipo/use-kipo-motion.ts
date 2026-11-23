import { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { KipoMood } from './kipo-types';

const smooth = Easing.inOut(Easing.sin);

// Valores animados de Kipo (DESIGN.md). Con "Reducir movimiento" todo queda quieto.
export function useKipoMotion(mood: KipoMood, animated: boolean) {
  const reduced = useReducedMotion();
  const float = useSharedValue(0); // 0 abajo → 1 arriba
  const ring = useSharedValue(0); // grados
  const blink = useSharedValue(1); // escala vertical de los ojos
  const look = useSharedValue(0); // desplazamiento de los ojos (unidades del viewBox)
  const zzz = useSharedValue(0); // progreso 0 → 1

  useEffect(() => {
    const values = [float, ring, blink, look, zzz];
    values.forEach(cancelAnimation);
    float.value = 0;
    ring.value = 0;
    blink.value = 1;
    look.value = 0;
    zzz.value = 0;
    if (reduced || !animated) return;

    const sleeping = mood === 'dormido';
    // Flotar: 3 s ida y vuelta (dormido: 4,5 s).
    float.value = withRepeat(
      withTiming(1, { duration: sleeping ? 2250 : 1500, easing: smooth }),
      -1,
      true,
    );
    // Argolla: péndulo de −10° a 10° (ida y vuelta en 2,6 s). Con reversa no hay salto
    // ni pausa en el centro, donde un péndulo va más rápido.
    ring.value = -10;
    ring.value = withRepeat(withTiming(10, { duration: 1300, easing: smooth }), -1, true);
    if (!sleeping) {
      // Parpadeo: cada 4 s, los ojos se cierran unos 0,2 s.
      blink.value = withRepeat(
        withSequence(
          withDelay(3800, withTiming(0.1, { duration: 100 })),
          withTiming(1, { duration: 100 }),
        ),
        -1,
      );
    }
    if (mood === 'buscando') {
      // Buscando: de −4 a 5 de lado a lado en 3,2 s. Se parte en −4 y se usa reversa:
      // withRepeat sin reversa vuelve al valor inicial en cada vuelta y se notaba un salto.
      look.value = -4;
      look.value = withRepeat(withTiming(5, { duration: 1600, easing: smooth }), -1, true);
    }
    if (sleeping) {
      zzz.value = withRepeat(withTiming(1, { duration: 3000, easing: Easing.linear }), -1, false);
    }
    return () => values.forEach(cancelAnimation);
  }, [mood, animated, reduced, float, ring, blink, look, zzz]);

  return { float, ring, blink, look, zzz, reduced };
}
