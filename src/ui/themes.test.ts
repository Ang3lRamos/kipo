import { buildTheme, palettes, type ColorMode } from './themes';

// DESIGN.md: el texto debe tener un contraste de al menos 4.5:1 (WCAG AA).

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

const modes: ColorMode[] = ['light', 'dark'];
const cases = palettes.flatMap(({ name }) => modes.map((mode) => [name, mode] as const));

describe.each(cases)('contraste del tema %s / %s', (palette, mode) => {
  const { colors } = buildTheme(palette, mode);

  it.each([
    ['texto sobre fondo', colors.text, colors.background],
    ['texto sobre tarjeta', colors.text, colors.surface],
    ['texto secundario sobre fondo', colors.textMuted, colors.background],
    ['texto secundario sobre tarjeta', colors.textMuted, colors.surface],
    ['acento sobre fondo', colors.accentText, colors.background],
    ['texto del botón principal', colors.onPrimary, colors.primary],
    ['aviso de vencimiento', colors.warning.text, colors.warning.bg],
    ['aviso de precaución', colors.caution.text, colors.caution.bg],
    ['tarjeta de ubicación', colors.location.text, colors.location.bg],
    ['error', colors.danger.text, colors.danger.bg],
    ['error sobre tarjeta', colors.danger.text, colors.surface],
  ])('%s ≥ 4.5:1', (_label, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('cada categoría es legible', () => {
    for (const { bg, text } of Object.values(colors.categories)) {
      expect(contrast(text, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
