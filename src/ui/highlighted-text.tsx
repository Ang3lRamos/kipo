import { Text } from 'react-native';

import { parseHighlight } from '@/features/documents/highlight';

import { AppText, type TextVariant } from './text';
import { useTheme } from './theme-provider';

type Props = { marked: string; variant?: TextVariant; color?: string; numberOfLines?: number };

// Texto con las coincidencias de la búsqueda resaltadas (color "precaución" del tema).
export function HighlightedText({ marked, variant = 'body', color, numberOfLines }: Props) {
  const theme = useTheme();
  const { caution } = theme.colors;
  return (
    <AppText variant={variant} color={color ?? 'text'} numberOfLines={numberOfLines}>
      {parseHighlight(marked).map((segment, index) =>
        segment.match ? (
          <Text
            key={index}
            style={{
              backgroundColor: caution.bg,
              color: caution.text,
              fontFamily: theme.font.bodySemibold,
            }}
          >
            {segment.text}
          </Text>
        ) : (
          segment.text
        ),
      )}
    </AppText>
  );
}
