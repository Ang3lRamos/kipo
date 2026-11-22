// Tokens de diseño de Kipo. Fuente: mockup "Kipo — mockup de la app".
// Cada paleta tiene versión clara y oscura; el usuario elige paleta y modo.

export type PaletteName = 'menta' | 'lavanda' | 'durazno' | 'cielo';
export type ColorMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  accentText: string;
  border: string;
  categories: Record<CategoryKey, { bg: string; text: string }>;
  warning: { bg: string; text: string };
  caution: { bg: string; text: string };
  location: { bg: string; text: string; icon: string };
}

export type CategoryKey = 'identidad' | 'vehiculo' | 'salud' | 'finanzas' | 'garantias' | 'laboral' | 'hogar' | 'otro';

export interface MascotColors {
  light: string;
  mid: string;
  dark: string;
  shade: string;
  footLight: string;
  footDark: string;
}

const lightCategories: ThemeColors['categories'] = {
  identidad: { bg: '#CFF3E6', text: '#14453A' },
  vehiculo: { bg: '#DDEBFF', text: '#24497F' },
  salud: { bg: '#FFE4D6', text: '#8A3A17' },
  finanzas: { bg: '#FFF1C9', text: '#6B4600' },
  garantias: { bg: '#E7E2FB', text: '#3A2C8A' },
  laboral: { bg: '#D8F3F0', text: '#1B4D48' },
  hogar: { bg: '#FFE4EE', text: '#7A2346' },
  otro: { bg: '#EDEFF4', text: '#2B2F3A' },
};

const darkCategories: ThemeColors['categories'] = {
  identidad: { bg: '#2F4A44', text: '#EEF0F6' },
  vehiculo: { bg: '#2E3C5C', text: '#EEF0F6' },
  salud: { bg: '#503A33', text: '#EEF0F6' },
  finanzas: { bg: '#4D4430', text: '#EEF0F6' },
  garantias: { bg: '#3D3760', text: '#EEF0F6' },
  laboral: { bg: '#2B4A48', text: '#EEF0F6' },
  hogar: { bg: '#4D3040', text: '#EEF0F6' },
  otro: { bg: '#33384F', text: '#EEF0F6' },
};

interface PaletteSeed {
  label: string;
  background: string;
  primary: string;
  onPrimary: string;
  accentText: string;
  mascot: MascotColors;
}

const seeds: Record<PaletteName, PaletteSeed> = {
  menta: {
    label: 'Menta',
    background: '#F8F9FC',
    primary: '#A8E6CF',
    onPrimary: '#14453A',
    accentText: '#1F7A62',
    mascot: { light: '#C8FAEA', mid: '#3DD9B0', dark: '#0E8A6C', shade: '#0A5E4D', footLight: '#5FE3BF', footDark: '#0B7A5F' },
  },
  lavanda: {
    label: 'Lavanda',
    background: '#FAF8FF',
    primary: '#D9CFFF',
    onPrimary: '#3A2C8A',
    accentText: '#5B4BB7',
    mascot: { light: '#EFE9FF', mid: '#A993F5', dark: '#5E47C9', shade: '#3F2E99', footLight: '#C1B0FA', footDark: '#5240B5' },
  },
  durazno: {
    label: 'Durazno',
    background: '#FFF9F5',
    primary: '#FFD2BE',
    onPrimary: '#7A2E12',
    accentText: '#A5481F',
    mascot: { light: '#FFEBE1', mid: '#FFA27F', dark: '#D2603A', shade: '#9A3F20', footLight: '#FFBFA5', footDark: '#C05532' },
  },
  cielo: {
    label: 'Cielo',
    background: '#F6F9FF',
    primary: '#CFE2FF',
    onPrimary: '#1E3F78',
    accentText: '#2F5DA8',
    mascot: { light: '#E4EFFF', mid: '#7FB0FF', dark: '#3466C2', shade: '#22488F', footLight: '#A8CBFF', footDark: '#2F5CB0' },
  },
};

export const palettes = Object.entries(seeds).map(([name, s]) => ({ name: name as PaletteName, label: s.label }));

export function buildTheme(palette: PaletteName, mode: ColorMode) {
  const s = seeds[palette];
  const dark = mode === 'dark';
  const colors: ThemeColors = {
    background: dark ? '#1E2130' : s.background,
    surface: dark ? '#2A2E40' : '#FFFFFF',
    surfaceAlt: dark ? '#25293A' : '#EDEFF4',
    text: dark ? '#EEF0F6' : '#2B2F3A',
    textMuted: dark ? '#A9AEC0' : '#5E6372',
    primary: s.primary,
    onPrimary: s.onPrimary,
    accentText: dark ? s.primary : s.accentText,
    border: dark ? '#3A3F55' : '#E3E6EC',
    categories: dark ? darkCategories : lightCategories,
    warning: dark ? { bg: '#503A33', text: '#FFD2BE' } : { bg: '#FFE4D6', text: '#A5481F' },
    caution: dark ? { bg: '#4D4430', text: '#FFE7A3' } : { bg: '#FFF1C9', text: '#7A5000' },
    location: dark ? { bg: '#3D3760', text: '#EEF0F6', icon: '#D9CFFF' } : { bg: '#E7E2FB', text: '#2B2F3A', icon: '#5B4BB7' },
  };
  return { palette, mode, colors, mascot: s.mascot, ...tokens };
}

export const tokens = {
  radius: { sm: 12, md: 14, lg: 18, xl: 20, xxl: 24, pill: 999 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
  font: {
    heading: 'SpaceGrotesk_700Bold',
    headingMedium: 'SpaceGrotesk_500Medium',
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    bodySemibold: 'Inter_600SemiBold',
  },
  size: { caption: 12, small: 13, body: 15, input: 16, h3: 17, h2: 24, h1: 28, display: 30 },
  touch: { min: 44, button: 52, fab: 56 },
  shadow: {
    card: { shadowColor: '#2B2F3A', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    float: { shadowColor: '#2B2F3A', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  },
} as const;

export type Theme = ReturnType<typeof buildTheme>;
