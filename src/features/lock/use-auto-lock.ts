import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { isAutoLockSuspended, resumeAutoLock } from './auto-lock-guard';

// Bloqueo automático: al pasar a segundo plano y tras `idleMinutes` sin tocar la pantalla.
// Devuelve una función que la UI llama en cada toque para reiniciar el contador.
export function useAutoLock(enabled: boolean, lock: () => void, idleMinutes = 5) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bump = useCallback(() => {
    if (!enabled) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(lock, idleMinutes * 60 * 1000);
  }, [enabled, lock, idleMinutes]);

  useEffect(() => {
    if (!enabled) return;
    bump();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'background' && !isAutoLockSuspended()) lock();
      if (next === 'active') {
        resumeAutoLock();
        bump();
      }
    });
    return () => {
      subscription.remove();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [enabled, lock, bump]);

  return bump;
}
