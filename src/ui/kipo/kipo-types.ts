import type { MascotColors } from '../themes';

export type KipoMood = 'feliz' | 'buscando' | 'dormido' | 'guino';

// Todas las capas comparten este viewBox (el de assets/kipo-mascota.svg).
export const viewBox = { width: 200, height: 220 } as const;
export const viewBoxString = `0 0 ${viewBox.width} ${viewBox.height}`;

// Por debajo de este tamaño se dibuja la versión simple (sin brillos ni mejillas).
export const simpleBelow = 48;

export type LayerProps = {
  colors: MascotColors;
  mood: KipoMood;
  simple: boolean;
  idPrefix: string;
};
