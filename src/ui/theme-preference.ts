import * as SecureStore from 'expo-secure-store';

import { palettes, type PaletteName } from './themes';

// La elección de tema se guarda fuera de la base cifrada: la pantalla de bloqueo ya la
// necesita y el color elegido no es un dato sensible. Se lee de forma síncrona para
// aplicarla antes de ocultar el splash.

export type ModePreference = 'light' | 'dark' | 'system';
export type ThemePreference = { palette: PaletteName; mode: ModePreference; chosen: boolean };

const key = 'kipo.theme.v1';
export const defaultPreference: ThemePreference = {
  palette: 'menta',
  mode: 'system',
  chosen: false,
};

function isPalette(value: unknown): value is PaletteName {
  return palettes.some((p) => p.name === value);
}

function isMode(value: unknown): value is ModePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function loadThemePreference(): ThemePreference {
  try {
    const raw = SecureStore.getItem(key);
    if (!raw) return defaultPreference;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return defaultPreference;
    const { palette, mode } = parsed as Record<string, unknown>;
    return isPalette(palette) && isMode(mode) ? { palette, mode, chosen: true } : defaultPreference;
  } catch {
    return defaultPreference;
  }
}

export function saveThemePreference(preference: ThemePreference): void {
  SecureStore.setItem(key, JSON.stringify({ palette: preference.palette, mode: preference.mode }));
}
