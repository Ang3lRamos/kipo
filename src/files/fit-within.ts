export type Size = { width: number; height: number };

// Tamaño para que el lado largo no pase de `maxSide`, conservando la proporción.
// Devuelve null si la imagen ya cabe: nunca se agranda.
export function fitWithin(size: Size, maxSide: number): Size | null {
  const longSide = Math.max(size.width, size.height);
  if (longSide <= maxSide) return null;
  const ratio = maxSide / longSide;
  return {
    width: Math.max(1, Math.round(size.width * ratio)),
    height: Math.max(1, Math.round(size.height * ratio)),
  };
}
