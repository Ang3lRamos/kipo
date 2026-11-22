import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from './theme-provider';
import type { Theme } from './themes';

export type TextVariant =
  'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyMedium' | 'label' | 'small' | 'caption';

type ColorName = 'text' | 'textMuted' | 'accentText' | 'onPrimary';

type Props = TextProps & {
  variant?: TextVariant;
  color?: ColorName | (string & {});
  align?: TextStyle['textAlign'];
};

function variantStyle(theme: Theme, variant: TextVariant): TextStyle {
  const { font, size } = theme;
  switch (variant) {
    case 'display':
      return { fontFamily: font.heading, fontSize: size.display, lineHeight: 36 };
    case 'h1':
      return { fontFamily: font.heading, fontSize: size.h1, lineHeight: 34 };
    case 'h2':
      return { fontFamily: font.heading, fontSize: size.h2, lineHeight: 30 };
    case 'h3':
      return { fontFamily: font.heading, fontSize: size.h3, lineHeight: 22 };
    case 'bodyMedium':
      return { fontFamily: font.bodyMedium, fontSize: size.body, lineHeight: 21 };
    case 'label':
      return { fontFamily: font.bodySemibold, fontSize: size.small, lineHeight: 18 };
    case 'small':
      return { fontFamily: font.body, fontSize: size.small, lineHeight: 18 };
    case 'caption':
      return { fontFamily: font.bodyMedium, fontSize: size.caption, lineHeight: 16 };
    default:
      return { fontFamily: font.body, fontSize: size.body, lineHeight: 21 };
  }
}

// Texto con la tipografía y los colores del tema. `color` acepta un nombre del tema o un color.
export function AppText({ variant = 'body', color = 'text', align, style, ...rest }: Props) {
  const theme = useTheme();
  const named: Record<ColorName, string> = {
    text: theme.colors.text,
    textMuted: theme.colors.textMuted,
    accentText: theme.colors.accentText,
    onPrimary: theme.colors.onPrimary,
  };
  const resolved = color in named ? named[color as ColorName] : color;
  return (
    <Text
      {...rest}
      style={[variantStyle(theme, variant), { color: resolved, textAlign: align }, style]}
    />
  );
}
