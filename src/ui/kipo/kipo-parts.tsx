import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { ringColors } from '../themes';

import { viewBoxString, type KipoMood } from './kipo-types';

const ink = '#2B2F3A';

// Argolla de llavero (va detrás del cuerpo y se balancea).
export function KipoRing({ idPrefix }: { idPrefix: string }) {
  const id = `${idPrefix}ring`;
  return (
    <Svg width="100%" height="100%" viewBox={viewBoxString}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={ringColors.light} />
          <Stop offset="0.5" stopColor={ringColors.mid} />
          <Stop offset="1" stopColor={ringColors.dark} />
        </LinearGradient>
      </Defs>
      <Rect x="95" y="40" width="10" height="18" rx="4" fill={`url(#${id})`} />
      <Circle cx="100" cy="30" r="14" fill="none" stroke={`url(#${id})`} strokeWidth="7" />
      <Path
        d="M90 22 A12 12 0 0 1 104 17"
        fill="none"
        stroke={ringColors.shine}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.8"
      />
    </Svg>
  );
}

// Sombra en el piso (degradado radial en lugar de desenfoque).
export function KipoShadow({ idPrefix }: { idPrefix: string }) {
  const id = `${idPrefix}floor`;
  return (
    <Svg width="100%" height="100%" viewBox={viewBoxString}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={ink} stopOpacity="0.22" />
          <Stop offset="1" stopColor={ink} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="100" cy="206" rx="66" ry="12" fill={`url(#${id})`} />
    </Svg>
  );
}

function OpenEye({ cx, simple }: { cx: number; simple: boolean }) {
  return (
    <>
      <Ellipse cx={cx} cy="112" rx="8" ry="11" fill={ink} />
      {simple ? null : <Circle cx={cx + 3} cy="107" r="3" fill="#FFFFFF" />}
    </>
  );
}

function ClosedEye({ cx, up }: { cx: number; up: boolean }) {
  // up: guiño ("^"); si no, ojo dormido ("‿").
  const d = up
    ? `M${cx - 9} 114 Q${cx} 104 ${cx + 9} 114`
    : `M${cx - 9} 110 Q${cx} 119 ${cx + 9} 110`;
  return <Path d={d} fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />;
}

// Ojos: capa aparte para parpadear (escala vertical) y mirar de lado (desplazamiento).
export function KipoEyes({ mood, simple }: { mood: KipoMood; simple: boolean }) {
  return (
    <Svg width="100%" height="100%" viewBox={viewBoxString}>
      {mood === 'dormido' ? (
        <>
          <ClosedEye cx={80} up={false} />
          <ClosedEye cx={120} up={false} />
        </>
      ) : mood === 'guino' ? (
        <>
          <OpenEye cx={80} simple={simple} />
          <ClosedEye cx={120} up />
        </>
      ) : (
        <>
          <OpenEye cx={80} simple={simple} />
          <OpenEye cx={120} simple={simple} />
        </>
      )}
    </Svg>
  );
}
