import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

// Cuándo se bloquea Kipo. Se guarda fuera de la base cifrada (como el tema) porque el bloqueo
// funciona antes de abrirla. No es un dato sensible.

export const idleOptions = [1, 2, 5, 10, 15] as const; // minutos sin tocar la pantalla
export const backgroundOptions = [0, 30, 60] as const; // segundos fuera de la app (0 = al instante)

export type LockPreferences = {
  idleMinutes: (typeof idleOptions)[number];
  backgroundSeconds: (typeof backgroundOptions)[number];
};

export const defaultLockPreferences: LockPreferences = { idleMinutes: 5, backgroundSeconds: 0 };
const key = 'kipo.lock.v1';

function load(): LockPreferences {
  try {
    const raw = SecureStore.getItem(key);
    if (!raw) return defaultLockPreferences;
    const parsed = JSON.parse(raw) as Partial<LockPreferences>;
    const idle = idleOptions.find((o) => o === parsed.idleMinutes);
    const background = backgroundOptions.find((o) => o === parsed.backgroundSeconds);
    return {
      idleMinutes: idle ?? defaultLockPreferences.idleMinutes,
      backgroundSeconds: background ?? defaultLockPreferences.backgroundSeconds,
    };
  } catch {
    return defaultLockPreferences;
  }
}

type Value = { preferences: LockPreferences; update: (patch: Partial<LockPreferences>) => void };
const Context = createContext<Value | null>(null);

export function LockPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(load);
  const update = useCallback((patch: Partial<LockPreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...patch };
      SecureStore.setItem(key, JSON.stringify(next));
      return next;
    });
  }, []);
  const value = useMemo(() => ({ preferences, update }), [preferences, update]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLockPreferences(): Value {
  const value = useContext(Context);
  if (!value) throw new Error('useLockPreferences debe usarse dentro de LockPreferencesProvider');
  return value;
}

export function describeIdle(minutes: number): string {
  return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
}

export function describeBackground(seconds: number): string {
  if (seconds === 0) return 'al instante';
  return seconds === 60 ? 'tras 1 minuto' : `tras ${seconds} segundos`;
}
