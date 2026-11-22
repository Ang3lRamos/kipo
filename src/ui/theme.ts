import { useColorScheme } from 'react-native';

const light = {
  background: '#f6f7f9',
  surface: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  primary: '#2563eb',
  primaryText: '#ffffff',
  danger: '#dc2626',
  warning: '#b45309',
  warningBg: '#fef3c7',
  dangerBg: '#fee2e2',
};

export type Theme = typeof light;

const dark: Theme = {
  background: '#0b0f14',
  surface: '#151a21',
  text: '#f3f4f6',
  muted: '#9ca3af',
  border: '#262d36',
  primary: '#60a5fa',
  primaryText: '#0b0f14',
  danger: '#f87171',
  warning: '#fbbf24',
  warningBg: '#3a2a07',
  dangerBg: '#3b1212',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
