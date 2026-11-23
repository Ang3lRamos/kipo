import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { isAutoLockSuspended, resumeAutoLock } from './auto-lock-guard';
import type { LockPreferences } from './lock-preferences';

// Bloqueo automático según las preferencias: al salir de la app (al instante o tras unos
// segundos) y tras unos minutos sin tocar la pantalla. Devuelve la función que la UI llama en
// cada toque para reiniciar el contador.
export function useAutoLock(enabled: boolean, lock: () => void, preferences: LockPreferences) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leftAt = useRef<number | null>(null);
  const { idleMinutes, backgroundSeconds } = preferences;

  const bump = useCallback(() => {
    if (!enabled) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(lock, idleMinutes * 60 * 1000);
  }, [enabled, lock, idleMinutes]);

  useEffect(() => {
    if (!enabled) return;
    bump();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'background' && !isAutoLockSuspended()) {
        if (backgroundSeconds === 0) lock();
        else leftAt.current = Date.now();
      }
      if (next === 'active') {
        const away = leftAt.current === null ? 0 : Date.now() - leftAt.current;
        leftAt.current = null;
        if (away > backgroundSeconds * 1000) return lock();
        resumeAutoLock();
        bump();
      }
    });
    return () => {
      subscription.remove();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [enabled, lock, bump, backgroundSeconds]);

  return bump;
}
