import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { loadThemePreference, saveThemePreference, type ThemePreference } from './theme-preference';
import { buildTheme, type Theme } from './themes';

type ThemeContextValue = {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: Omit<ThemePreference, 'chosen'>) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setState] = useState<ThemePreference>(loadThemePreference);

  const setPreference = useCallback((next: Omit<ThemePreference, 'chosen'>) => {
    const value = { ...next, chosen: true };
    saveThemePreference(value);
    setState(value);
  }, []);

  const value = useMemo(() => {
    const mode =
      preference.mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference.mode;
    return { theme: buildTheme(preference.palette, mode), preference, setPreference };
  }, [preference, system, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return value;
}

export function useTheme(): Theme {
  return useThemeContext().theme;
}

export function useThemePreference() {
  const { preference, setPreference } = useThemeContext();
  return { preference, setPreference };
}
