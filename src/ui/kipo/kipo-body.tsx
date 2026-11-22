import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { viewBoxString, type LayerProps } from './kipo-types';

const ink = '#2B2F3A';
const bodyPath =
  'M100 52 C150 52 172 92 172 135 C172 178 140 198 100 198 C60 198 28 178 28 135 C28 92 50 52 100 52 Z';

function Mouth({ mood }: { mood: LayerProps['mood'] }) {
  const stroke = { fill: 'none', stroke: ink, strokeWidth: 3.5, strokeLinecap: 'round' as const };
  if (mood === 'buscando') return <Ellipse cx="100" cy="131" rx="5" ry="6" fill={ink} />;
  if (mood === 'dormido') return <Path d="M94 131 Q100 135 106 131" {...stroke} />;
  if (mood === 'guino') return <Path d="M88 127 Q100 141 112 127" {...stroke} />;
  return <Path d="M91 128 Q100 137 109 128" {...stroke} />;
}

// Cuerpo, pies, sombreado, brillos, mejillas, boca y cerradura (todo lo que no se anima por separado).
export function KipoBody({ colors, mood, simple, idPrefix }: LayerProps) {
  const id = (name: string) => `${idPrefix}${name}`;
  return (
    <Svg width="100%" height="100%" viewBox={viewBoxString}>
      <Defs>
        <RadialGradient id={id('body')} cx="36%" cy="30%" r="75%">
          <Stop offset="0" stopColor={colors.light} />
          <Stop offset="0.45" stopColor={colors.mid} />
          <Stop offset="1" stopColor={colors.dark} />
        </RadialGradient>
        <RadialGradient id={id('shade')} cx="70%" cy="85%" r="60%">
          <Stop offset="0" stopColor={colors.shade} stopOpacity="0.45" />
          <Stop offset="1" stopColor={colors.shade} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id={id('foot')} cx="40%" cy="30%" r="80%">
          <Stop offset="0" stopColor={colors.footLight} />
          <Stop offset="1" stopColor={colors.footDark} />
        </RadialGradient>
        <RadialGradient id={id('shine')} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.7" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id={id('hole')} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ink} />
          <Stop offset="1" stopColor="#454B5C" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="70" cy="192" rx="20" ry="11" fill={`url(#${id('foot')})`} />
      <Ellipse cx="130" cy="192" rx="20" ry="11" fill={`url(#${id('foot')})`} />
      <Path d={bodyPath} fill={`url(#${id('body')})`} />
      <Path d={bodyPath} fill={`url(#${id('shade')})`} />
      {simple ? null : (
        <>
          {/* Brillo: degradado en lugar de feGaussianBlur, que en Android no es confiable. */}
          <Ellipse
            cx="68"
            cy="82"
            rx="28"
            ry="15"
            transform="rotate(-32 68 82)"
            fill={`url(#${id('shine')})`}
          />
          <Circle cx="58" cy="100" r="3.5" fill="#FFFFFF" opacity="0.7" />
          <Ellipse cx="64" cy="130" rx="10" ry="5.5" fill="#FF8F7A" opacity="0.4" />
          <Ellipse cx="136" cy="130" rx="10" ry="5.5" fill="#FF8F7A" opacity="0.4" />
        </>
      )}
      <Mouth mood={mood} />
      <Circle cx="100" cy="153" r="11" fill={`url(#${id('hole')})`} />
      <Path d="M94 158 L106 158 L110 180 L90 180 Z" fill={`url(#${id('hole')})`} />
      {simple ? null : (
        <Path
          d="M93 147 A8 8 0 0 1 101 144"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.35"
        />
      )}
    </Svg>
  );
}
